import pandas as pd
import numpy as np
from typing import List, Dict

def validate_time_series_data(data: List[Dict]) -> bool:
    """Validate time series data format"""
    if not data or len(data) < 3:
        return False
    
    required_fields = ['date', 'usage']
    for point in data:
        if not all(field in point for field in required_fields):
            return False
        
        # Check if usage is numeric
        try:
            float(point['usage'])
        except (ValueError, TypeError):
            return False
    
    return True

def prepare_time_series(data: List[Dict]) -> pd.Series:
    """Convert list of dicts to pandas time series"""
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    df.sort_index(inplace=True)
    return df['usage']
