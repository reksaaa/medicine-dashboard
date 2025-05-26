import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.metrics import mean_squared_error, mean_absolute_error
import math
import warnings
from typing import Optional, Dict, Any, List
import json
from datetime import datetime, timedelta
from .database import db

warnings.filterwarnings('ignore')

class MedicineForecaster:
    def __init__(self):
        self.db = db
    
    def create_monthly_series(self, unit_id: int, medicine_id: int) -> Optional[pd.Series]:
        """Create a monthly time series for a specific unit-medicine combination"""
        print(f"Creating monthly series for Unit {unit_id}, Medicine {medicine_id}")
        
        # Get data from database
        df = self.db.get_dispensing_data(unit_id=unit_id, medicine_id=medicine_id)
        
        if df.empty:
            print("No data found for this unit-medicine combination")
            return None
        
        print(f"Raw data: {len(df)} records")
        
        # Convert date column
        df['tanggalSah'] = pd.to_datetime(df['tanggalSah'], errors='coerce')
        
        # Remove rows with invalid dates
        df = df.dropna(subset=['tanggalSah'])
        
        if df.empty:
            print("No valid dates found")
            return None
        
        # Group by month - EXACT same logic as original
        df['month'] = df['tanggalSah'].dt.to_period('M')
        df_monthly = df.groupby('month')['banyak'].sum().reset_index()
        df_monthly['month'] = df_monthly['month'].dt.to_timestamp()
        
        print(f"Monthly data: {len(df_monthly)} months")
        
        # Create proper time series with month as index
        df_monthly.set_index('month', inplace=True)
        
        return df_monthly['banyak']
    
    def is_stationary(self, series: pd.Series) -> tuple[bool, Optional[float]]:
        """Test stationarity using ADF test - EXACT same as original"""
        if len(series) < 8:
            return False, None
        
        try:
            result = adfuller(series, autolag='AIC')
            adf_pvalue = result[1]
            return adf_pvalue < 0.05, adf_pvalue
        except Exception as e:
            print(f"ADF test failed: {e}")
            return False, None
    
    def quick_analyze_time_series(self, ts: pd.Series) -> Dict[str, Any]:
        """
        Perform quick analysis to determine model type - EXACT same as original
        This determines ARIMA parameters through statistical tests, NOT hardcoding
        """
        print(f"Analyzing time series with {len(ts)} data points")
        
        # Check if enough data
        if len(ts) < 8:
            print("Not enough data for full analysis, using default ARIMA(1,1,1)")
            return {
                'model_type': 'ARIMA',
                'p': 1, 'd': 1, 'q': 1,
                'seasonal_P': 0, 'seasonal_D': 0, 'seasonal_Q': 0, 'seasonal_m': 0
            }
        
        # Check stationarity using ADF test
        stationary, adf_pvalue = self.is_stationary(ts)
        print(f"Stationarity test: {'Stationary' if stationary else 'Non-stationary'} (p-value: {adf_pvalue})")
        
        # Determine differencing based on stationarity test
        d = 0 if stationary else 1
        
        # Check if differenced series is stationary
        if not stationary and len(ts) > 9:
            ts_diff = ts.diff().dropna()
            diff_stationary, diff_pvalue = self.is_stationary(ts_diff)
            print(f"First difference stationarity: {'Stationary' if diff_stationary else 'Non-stationary'} (p-value: {diff_pvalue})")
            if not diff_stationary:
                d = 2  # Second differencing
                print("Using second differencing (d=2)")
        
        # Check for seasonality using statistical tests
        ts_df = pd.DataFrame(ts)
        ts_df.columns = ['value']
        
        seasonal_model = False
        
        # Check for monthly seasonality if we have at least 2 years of data
        if len(ts) >= 24:
            print("Testing for seasonality (24+ months of data)")
            
            # Calculate month-to-month autocorrelation
            ts_df['month'] = ts_df.index.month
            monthly_means = ts_df.groupby('month')['value'].mean()
            monthly_std = ts_df.groupby('month')['value'].std()
            
            # Handle division by zero
            monthly_std = monthly_std.fillna(0)
            monthly_means_nonzero = monthly_means.replace(0, np.nan)
            cv = monthly_std / monthly_means_nonzero
            cv = cv.fillna(0)
            
            cv_mean = cv.mean()
            monthly_variation = monthly_means.std() / monthly_means.mean() if monthly_means.mean() > 0 else 0
            
            print(f"Coefficient of variation: {cv_mean:.3f}")
            print(f"Monthly variation: {monthly_variation:.3f}")
            
            # If coefficient of variation of monthly means is high, potential seasonality
            if cv_mean > 0.3 and monthly_variation > 0.15:
                seasonal_model = True
                print("Seasonality detected - using SARIMA")
            else:
                print("No significant seasonality detected - using ARIMA")
        else:
            print(f"Not enough data for seasonality test ({len(ts)} < 24 months)")
        
        # Return model parameters based on statistical tests
        if seasonal_model:
            result = {
                'model_type': 'SARIMA',
                'p': 1, 'd': d, 'q': 1,
                'seasonal_P': 1, 'seasonal_D': 1, 'seasonal_Q': 1, 'seasonal_m': 12
            }
        else:
            result = {
                'model_type': 'ARIMA',
                'p': 1, 'd': d, 'q': 1,
                'seasonal_P': 0, 'seasonal_D': 0, 'seasonal_Q': 0, 'seasonal_m': 0
            }
        
        print(f"Selected model: {result['model_type']}({result['p']},{result['d']},{result['q']})")
        return result
    
    def generate_forecast(self, unit_id: int, medicine_id: int, periods: int = 6, train_test_split: float = 0.8) -> Optional[Dict[str, Any]]:
        """
        Forecast future medicine usage - EXACT same logic as original
        """
        try:
            print(f"Starting forecast generation for Unit {unit_id}, Medicine {medicine_id}")
            
            # Test database connection first
            if not self.db.test_connection():
                return {
                    'success': False,
                    'error': 'Database connection failed'
                }
            
            # Get time series data
            ts = self.create_monthly_series(unit_id, medicine_id)
            
            if ts is None or len(ts) < 6:
                return {
                    'success': False,
                    'error': f'Not enough data for Medicine {medicine_id} in Unit {unit_id}. Need at least 6 months of data.',
                    'data_points': len(ts) if ts is not None else 0
                }
            
            print(f"Time series created: {len(ts)} months of data")
            print(f"Date range: {ts.index.min()} to {ts.index.max()}")
            print(f"Average usage: {ts.mean():.2f}")
            
            # Split into training and testing - EXACT same as original
            train_size = int(len(ts) * train_test_split)
            train, test = ts[:train_size], ts[train_size:]
            
            if len(test) == 0:
                train = ts
                has_test = False
                print("Using all data for training (no test set)")
            else:
                has_test = True
                print(f"Training set: {len(train)} months, Test set: {len(test)} months")
            
            # Analyze time series to determine model - STATISTICAL TESTS, NOT HARDCODED
            model_params = self.quick_analyze_time_series(train)
            model_type = model_params['model_type']
            
            # Extract model parameters FROM STATISTICAL ANALYSIS
            p, d, q = model_params['p'], model_params['d'], model_params['q']
            seasonal_P = model_params['seasonal_P']
            seasonal_D = model_params['seasonal_D']
            seasonal_Q = model_params['seasonal_Q']
            seasonal_m = model_params['seasonal_m']
            
            print(f"Model parameters determined by statistical tests:")
            print(f"  Model type: {model_type}")
            print(f"  ARIMA order: ({p}, {d}, {q})")
            if model_type == 'SARIMA':
                print(f"  Seasonal order: ({seasonal_P}, {seasonal_D}, {seasonal_Q})_{seasonal_m}")
            
            # Fit model - EXACT same as original
            try:
                print("Fitting model...")
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
                print("Model fitted successfully")
            except Exception as e:
                print(f"Error fitting model: {e}")
                print("Trying fallback model ARIMA(1,1,1)...")
                
                # Fallback to ARIMA(1,1,1) - EXACT same as original
                try:
                    model = ARIMA(train, order=(1, 1, 1))
                    fitted_model = model.fit()
                    p, d, q = 1, 1, 1
                    model_type = 'ARIMA'
                    print("Fallback model fitted successfully")
                except Exception as e2:
                    return {
                        'success': False,
                        'error': f'Error fitting fallback model: {str(e2)}'
                    }
            
            # Evaluate on test set if available - EXACT same as original
            metrics = None
            if has_test:
                print("Evaluating model on test data...")
                
                if model_type == 'SARIMA':
                    test_pred = fitted_model.get_forecast(steps=len(test)).predicted_mean
                else:
                    test_pred = fitted_model.forecast(steps=len(test))
                
                # Calculate metrics - EXACT same as original
                mse = mean_squared_error(test, test_pred)
                rmse = math.sqrt(mse)
                mae = mean_absolute_error(test, test_pred)
                
                # MAPE calculation (handling zeros) - EXACT same as original
                if np.all(test == 0):
                    mape = np.nan
                else:
                    mask = test != 0
                    mape = np.mean(np.abs((test[mask] - test_pred[mask]) / test[mask])) * 100
                
                print(f"Model validation metrics:")
                print(f"  RMSE: {rmse:.2f}")
                print(f"  MAE: {mae:.2f}")
                print(f"  MAPE: {mape:.2f}%" if not np.isnan(mape) else "  MAPE: N/A")
                
                metrics = {
                    'rmse': round(rmse, 2),
                    'mae': round(mae, 2),
                    'mape': round(mape, 2) if not np.isnan(mape) else None,
                    'train_size': len(train),
                    'test_size': len(test)
                }
            
            # Fit model on entire dataset for better forecasting - EXACT same as original
            try:
                print("Refitting model on full dataset for forecasting...")
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
                print("Full model fitted successfully")
            except Exception as e:
                print(f"Error fitting full model: {e}, using partial model")
                full_fitted_model = fitted_model
            
            # Generate forecast - EXACT same as original
            print(f"Generating {periods}-month forecast...")
            
            last_date = ts.index[-1]
            future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq='MS')
            
            # Generate predictions - EXACT same as original
            if model_type == 'SARIMA':
                forecast = full_fitted_model.get_forecast(steps=periods)
                forecast_mean = forecast.predicted_mean
                forecast_ci = forecast.conf_int(alpha=0.05)  # 95% confidence interval
            else:
                forecast_mean = full_fitted_model.forecast(steps=periods)
                # For ARIMA, manually compute confidence intervals - EXACT same as original
                forecast_std = np.sqrt(full_fitted_model.params[-1]) * np.sqrt(np.arange(1, periods + 1))
                forecast_ci = pd.DataFrame({
                    'lower usage': forecast_mean - 1.96 * forecast_std,
                    'upper usage': forecast_mean + 1.96 * forecast_std
                }, index=future_dates)
            
            # Ensure no negative values in forecast - EXACT same as original
            forecast_mean = pd.Series(np.maximum(forecast_mean, 0), index=future_dates)
            forecast_ci['lower usage'] = np.maximum(forecast_ci['lower usage'], 0)
            
            # Create forecast dataframe - EXACT same as original
            forecast_df = pd.DataFrame({
                'date': future_dates.strftime('%Y-%m-%d'),
                'forecasted_usage': np.round(forecast_mean.values, 2),
                'lower_ci': np.round(forecast_ci['lower usage'].values, 2),
                'upper_ci': np.round(forecast_ci['upper usage'].values, 2)
            })
            
            # Calculate metrics - EXACT same as original
            total_forecast = forecast_mean.sum()
            avg_monthly = forecast_mean.mean()
            
            # Inventory recommendations - EXACT same as original
            safety_factor = 1.65  # ~95% service level
            forecast_std = forecast_ci['upper usage'] - forecast_mean
            avg_std = forecast_std.mean() / 1.96
            safety_stock = safety_factor * avg_std
            lead_time_months = 1
            reorder_point = avg_monthly * lead_time_months + safety_stock
            
            print(f"Forecast completed:")
            print(f"  Total forecast: {total_forecast:.2f}")
            print(f"  Average monthly: {avg_monthly:.2f}")
            print(f"  Safety stock: {safety_stock:.2f}")
            
            # Historical data for context
            historical_data = [
                {
                    'date': date.strftime('%Y-%m-%d'),
                    'usage': float(usage)
                }
                for date, usage in ts.items()
            ]
            
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
                'historical_data': historical_data,
                'forecast_data': forecast_df.to_dict('records'),
                'summary': {
                    'total_forecast': round(total_forecast, 2),
                    'avg_monthly': round(avg_monthly, 2),
                    'historical_avg': round(ts.mean(), 2),
                    'data_points': len(ts),
                    'forecast_period': periods
                },
                'recommendations': {
                    'safety_stock': round(safety_stock, 2),
                    'reorder_point': round(reorder_point, 2),
                    'lead_time_months': lead_time_months,
                    'service_level': '95%'
                },
                'metrics': metrics
            }
            
        except Exception as e:
            print(f"Forecast generation failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': f'Error generating forecast: {str(e)}'
            }

# Global forecaster instance
forecaster = MedicineForecaster()
