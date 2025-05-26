from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ...models.forecasting import forecaster

router = APIRouter()

@router.get("/units")
async def get_available_units():
    """Get list of units with dispensing data"""
    try:
        units = forecaster.db.get_available_units()
        return {
            'success': True,
            'data': units
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/units/{unit_id}/medicines")
async def get_unit_medicines(unit_id: int):
    """Get list of medicines for a specific unit"""
    try:
        medicines = forecaster.db.get_available_medicines(unit_id=unit_id)
        return {
            'success': True,
            'data': medicines
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_forecast(
    unit_id: int = Query(..., description="Unit ID"),
    medicine_id: int = Query(..., description="Medicine ID"),
    periods: int = Query(6, ge=1, le=12, description="Number of months to forecast"),
    train_test_split: float = Query(0.8, ge=0.5, le=1.0, description="Training data proportion")
):
    """Generate forecast for specific unit and medicine using real ARIMA/SARIMA"""
    try:
        result = forecaster.generate_forecast(unit_id, medicine_id, periods, train_test_split)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/medicines")
async def get_all_medicines():
    """Get list of all medicines with dispensing data"""
    try:
        medicines = forecaster.db.get_available_medicines()
        return {
            'success': True,
            'data': medicines
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
