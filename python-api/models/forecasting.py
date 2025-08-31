import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.metrics import mean_squared_error, mean_absolute_error
import math
import warnings
from typing import List, Dict, Any
import logging

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)

class ForecastingModel:
    """
    Real ARIMA/SARIMA forecasting model
    Exactly matching the original Python implementation
    """
    
    def __init__(self):
        self.model = None
        self.fitted_model = None
    
    def is_stationary(self, series: pd.Series) -> tuple:
        """Test stationarity using ADF test"""
        if len(series) < 8:
            return False, None
        result = adfuller(series, autolag='AIC')
        adf_pvalue = result[1]
        return adf_pvalue < 0.05, adf_pvalue
    
    def quick_analyze_time_series(self, ts: pd.Series) -> Dict[str, Any]:
        """Perform a quick analysis to determine appropriate model type and parameters"""
        # Check if enough data
        if len(ts) < 8:
            return {
                'model_type': 'ARIMA',
                'p': 1, 'd': 1, 'q': 1,
                'seasonal_P': 0, 'seasonal_D': 0, 'seasonal_Q': 0, 'seasonal_m': 0
            }
        
        # Check stationarity
        stationary, _ = self.is_stationary(ts)
        
        # Determine differencing
        d = 0 if stationary else 1
        
        # Check if differenced series is stationary
        if not stationary and len(ts) > 9:
            ts_diff = ts.diff().dropna()
            diff_stationary, _ = self.is_stationary(ts_diff)
            if not diff_stationary:
                d = 2  # Second differencing
        
        # Check for seasonality
        ts_df = pd.DataFrame(ts)
        ts_df.columns = ['value']
        
        seasonal_model = False
        
        # Check for monthly seasonality if we have at least 2 years of data
        if len(ts) >= 24:
            # Calculate month-to-month autocorrelation
            ts_df['month'] = ts_df.index.month
            monthly_means = ts_df.groupby('month')['value'].mean()
            monthly_std = ts_df.groupby('month')['value'].std()
            cv = monthly_std / monthly_means
            
            # If coefficient of variation of monthly means is high, potential seasonality
            if cv.mean() > 0.3 and monthly_means.std() / monthly_means.mean() > 0.15:
                seasonal_model = True
                seasonal_m = 12
                seasonal_P, seasonal_D, seasonal_Q = 1, 1, 1
        
        # Default parameters
        if seasonal_model:
            return {
                'model_type': 'SARIMA',
                'p': 1, 'd': d, 'q': 1,
                'seasonal_P': 1, 'seasonal_D': 1, 'seasonal_Q': 1, 'seasonal_m': 12
            }
        else:
            return {
                'model_type': 'ARIMA',
                'p': 1, 'd': d, 'q': 1,
                'seasonal_P': 0, 'seasonal_D': 0, 'seasonal_Q': 0, 'seasonal_m': 0
            }
    
    def generate_forecast(self, unit_id: int, medicine_id: int, historical_data: List[Dict], 
                         periods: int = 6, train_test_split: float = 0.8) -> Dict[str, Any]:
        """
        Generate forecast using real ARIMA/SARIMA models
        Exactly matching the original implementation
        """
        try:
            # Convert historical data to pandas Series
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            ts = df['usage']
            
            if len(ts) < 6:
                raise ValueError(f"Not enough data. Need at least 6 months, got {len(ts)}")
            
            logger.info(f"Historical data: {len(ts)} months")
            logger.info(f"Average monthly usage: {ts.mean():.2f} units")
            
            # Split into training and testing
            train_size = int(len(ts) * train_test_split)
            train, test = ts[:train_size], ts[train_size:]
            
            has_test = len(test) > 0
            if not has_test:
                train = ts
                logger.info("Using all data for training (no test set)")
            else:
                logger.info(f"Training set: {len(train)} months, Test set: {len(test)} months")
            
            # Analyze time series to determine model
            model_params = self.quick_analyze_time_series(train)
            model_type = model_params['model_type']
            
            # Extract model parameters
            p, d, q = model_params['p'], model_params['d'], model_params['q']
            seasonal_P = model_params['seasonal_P']
            seasonal_D = model_params['seasonal_D']
            seasonal_Q = model_params['seasonal_Q']
            seasonal_m = model_params['seasonal_m']
            
            logger.info(f"Selected model: {model_type}")
            if model_type == 'SARIMA':
                logger.info(f"Parameters: SARIMA({p},{d},{q})×({seasonal_P},{seasonal_D},{seasonal_Q})_{seasonal_m}")
            else:
                logger.info(f"Parameters: ARIMA({p},{d},{q})")
            
            # Fit model
            try:
                if model_type == 'SARIMA':
                    model = SARIMAX(train,
                                   order=(p, d, q),
                                   seasonal_order=(seasonal_P, seasonal_D, seasonal_Q, seasonal_m),
                                   enforce_stationarity=False,
                                   enforce_invertibility=False)
                    fitted_model = model.fit(disp=False)
                else:
                    model = ARIMA(train, order=(p, d, q))
                    fitted_model = model.fit()
                
                logger.info("Model successfully fitted")
            except Exception as e:
                logger.warning(f"Error fitting model: {str(e)}")
                logger.info("Trying fallback model ARIMA(1,1,1)...")
                
                model = ARIMA(train, order=(1, 1, 1))
                fitted_model = model.fit()
                p, d, q = 1, 1, 1
                model_type = 'ARIMA'
                logger.info("Fallback model successfully fitted")
            
            # Evaluate on test set if available
            metrics = {}
            if has_test:
                logger.info("Evaluating model on test data...")
                
                if model_type == 'SARIMA':
                    test_pred = fitted_model.get_forecast(steps=len(test)).predicted_mean
                else:
                    test_pred = fitted_model.forecast(steps=len(test))
                
                # Calculate metrics
                mse = mean_squared_error(test, test_pred)
                rmse = math.sqrt(mse)
                mae = mean_absolute_error(test, test_pred)
                
                # MAPE calculation (handling zeros)
                if np.all(test == 0):
                    mape = np.nan
                else:
                    mask = test != 0
                    mape = np.mean(np.abs((test[mask] - test_pred[mask]) / test[mask])) * 100
                
                metrics = {
                    'rmse': rmse,
                    'mae': mae,
                    'mape': mape if not np.isnan(mape) else 0,
                    'train_size': len(train),
                    'test_size': len(test)
                }
                
                logger.info(f"RMSE: {rmse:.2f}, MAE: {mae:.2f}, MAPE: {mape:.2f}%")
            
            # Fit model on entire dataset for better forecasting
            try:
                if model_type == 'SARIMA':
                    full_model = SARIMAX(ts,
                                       order=(p, d, q),
                                       seasonal_order=(seasonal_P, seasonal_D, seasonal_Q, seasonal_m),
                                       enforce_stationarity=False,
                                       enforce_invertibility=False)
                    full_fitted_model = full_model.fit(disp=False)
                else:
                    full_model = ARIMA(ts, order=(p, d, q))
                    full_fitted_model = full_model.fit()
                
                logger.info("Refitted model on full dataset for forecasting")
            except Exception as e:
                logger.warning(f"Error fitting full model: {str(e)}")
                full_fitted_model = fitted_model
            
            # Generate forecast
            logger.info(f"Generating {periods}-month forecast...")
            
            # Create future date range for forecasting
            last_date = ts.index[-1]
            future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq='MS')
            
            # Generate predictions
            if model_type == 'SARIMA':
                forecast = full_fitted_model.get_forecast(steps=periods)
                forecast_mean = forecast.predicted_mean
                forecast_ci = forecast.conf_int(alpha=0.05)  # 95% confidence interval
            else:
                forecast_mean = full_fitted_model.forecast(steps=periods)
                # For ARIMA, manually compute confidence intervals
                forecast_std = np.sqrt(full_fitted_model.params[-1]) * np.sqrt(np.arange(1, periods + 1))
                forecast_ci = pd.DataFrame({
                    'lower usage': forecast_mean - 1.96 * forecast_std,
                    'upper usage': forecast_mean + 1.96 * forecast_std
                }, index=future_dates)
            
            # Ensure no negative values in forecast
            forecast_mean = pd.Series(np.maximum(forecast_mean, 0), index=future_dates)
            forecast_ci['lower usage'] = np.maximum(forecast_ci['lower usage'], 0)
            
            # Create forecast data
            forecast_data = []
            for i, date in enumerate(future_dates):
                forecast_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'forecasted_usage': round(forecast_mean.iloc[i], 2),
                    'lower_ci': round(forecast_ci['lower usage'].iloc[i], 2),
                    'upper_ci': round(forecast_ci['upper usage'].iloc[i], 2)
                })
            
            # Calculate summary
            total_forecast = forecast_mean.sum()
            avg_monthly = forecast_mean.mean()
            historical_avg = ts.mean()
            
            # Inventory recommendations
            safety_factor = 1.65  # ~95% service level
            forecast_std = forecast_ci['upper usage'] - forecast_mean
            avg_std = forecast_std.mean() / 1.96
            safety_stock = safety_factor * avg_std
            lead_time_months = 1
            
            return {
                'success': True,
                'unit_id': unit_id,
                'medicine_id': medicine_id,
                'model_type': model_type,
                'model_parameters': {
                    'p': p, 'd': d, 'q': q,
                    'seasonal_P': seasonal_P, 'seasonal_D': seasonal_D, 
                    'seasonal_Q': seasonal_Q, 'seasonal_m': seasonal_m
                },
                'historical_data': [
                    {'date': date.strftime('%Y-%m-%d'), 'usage': usage}
                    for date, usage in ts.items()
                ],
                'forecast_data': forecast_data,
                'summary': {
                    'total_forecast': round(total_forecast, 2),
                    'avg_monthly': round(avg_monthly, 2),
                    'historical_avg': round(historical_avg, 2),
                    'data_points': len(ts),
                    'forecast_period': periods
                },
                'recommendations': {
                    'safety_stock': round(safety_stock, 2),
                    'reorder_point': round(avg_monthly * lead_time_months + safety_stock, 2),
                    'lead_time_months': lead_time_months,
                    'service_level': '95%'
                },
                'metrics': metrics
            }
            
        except Exception as e:
            logger.error(f"Forecast generation failed: {str(e)}")
            return {
                'success': False,
                'unit_id': unit_id,
                'medicine_id': medicine_id,
                'model_type': '',
                'model_parameters': {},
                'historical_data': [],
                'forecast_data': [],
                'summary': {},
                'recommendations': {},
                'metrics': {},
                'error': str(e)
            }
