"""
SolChain AI/ML Service

A simplified FastAPI app with working AI/ML models for:
- Demand forecasting
- Dynamic pricing
- Anomaly detection
- Energy optimization
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import os
import sys
import logging
import json
import math
from pathlib import Path

def clean_for_json(obj):
    """Clean object for JSON serialization by replacing NaN and inf values"""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj):
            return 0.0
        elif math.isinf(obj):
            return 1000.0 if obj > 0 else -1000.0
        else:
            return obj
    else:
        return obj

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure this directory is on sys.path
_APP_DIR = Path(__file__).resolve().parent
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

# Import simplified models
try:
    from models.demand_forecasting import DemandForecaster
    from models.dynamic_pricing import DynamicPricer
    from models.anomaly_detection import AnomalyDetector
    from models.energy_optimization import EnergyOptimizer
    logger.info("✓ All simplified models imported successfully")
except Exception as e:
    logger.error(f"Failed to import models: {e}")

# Data paths
BASE_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

DATA_PATHS = {
    "forecasting": os.path.join(BASE_DATA_DIR, "forecasting", "iot_simulation_data.csv"),
    "pricing": os.path.join(BASE_DATA_DIR, "pricing", "iot_simulation_data.csv"),
    "anomaly": os.path.join(BASE_DATA_DIR, "anomaly", "iot_simulation_data.csv"),
    "optimization": os.path.join(BASE_DATA_DIR, "optimization", "iot_simulation_data.csv")
}

# Initialize FastAPI app
app = FastAPI(
    title="SolChain AI/ML Service",
    description="Simple, working AI/ML models for energy management",
    version="1.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class EnergyData(BaseModel):
    deviceId: str
    deviceType: str
    consumption: float
    production: Optional[float] = 0.0
    temperature: Optional[float] = 25.0
    humidity: Optional[float] = 0.5
    solarIrradiance: Optional[float] = 0.0
    windSpeed: Optional[float] = 0.0
    hour: Optional[int] = 12
    dayOfWeek: Optional[int] = 1
    month: Optional[int] = 6
    isWeekend: Optional[bool] = False
    hasSmartMeter: Optional[bool] = True
    hasSolar: Optional[bool] = False

class PredictionResponse(BaseModel):
    success: bool
    predictions: List[float]
    metadata: Dict[str, Any]

class MetricsResponse(BaseModel):
    success: bool
    metrics: Dict[str, Any]

class TrainingResponse(BaseModel):
    success: bool
    message: str
    metrics: Optional[Dict[str, Any]] = None

# Global model instances
forecaster = None
pricer = None
anomaly_detector = None
optimizer = None

def load_models():
    """Load all models"""
    global forecaster, pricer, anomaly_detector, optimizer
    
    try:
        forecaster = DemandForecaster()
        pricer = DynamicPricer()
        anomaly_detector = AnomalyDetector()
        optimizer = EnergyOptimizer()
        logger.info("✓ All models initialized")
    except Exception as e:
        logger.error(f"Failed to initialize models: {e}")

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    load_models()

def load_data(data_type: str) -> pd.DataFrame:
    """Load data for specific model type"""
    try:
        data_path = DATA_PATHS.get(data_type)
        if not data_path or not os.path.exists(data_path):
            raise FileNotFoundError(f"Data file not found: {data_path}")
        
        df = pd.read_csv(data_path)
        logger.info(f"Loaded {len(df)} records for {data_type}")
        return df
    except Exception as e:
        logger.error(f"Failed to load {data_type} data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load data: {e}")

def prepare_input_data(energy_data: List[EnergyData]) -> pd.DataFrame:
    """Convert input data to DataFrame"""
    data_list = []
    for item in energy_data:
        data_dict = item.dict()
        # Calculate netEnergy
        data_dict['netEnergy'] = data_dict['production'] - data_dict['consumption']
        # Convert boolean to int
        data_dict['isWeekend'] = int(data_dict['isWeekend'])
        data_dict['hasSmartMeter'] = int(data_dict['hasSmartMeter'])
        data_dict['hasSolar'] = int(data_dict['hasSolar'])
        data_list.append(data_dict)
    
    return pd.DataFrame(data_list)

# ==================== API ENDPOINTS ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SolChain AI/ML Service - Simple Version",
        "status": "running",
        "models": {
            "forecaster": forecaster is not None,
            "pricer": pricer is not None,
            "anomaly_detector": anomaly_detector is not None,
            "optimizer": optimizer is not None
        }
    }

@app.get("/datasets/info")
async def get_datasets_info():
    """Get information about available datasets"""
    info = {}
    
    for data_type, path in DATA_PATHS.items():
        try:
            if os.path.exists(path):
                df = pd.read_csv(path, nrows=1)  # Just read header
                info[data_type] = {
                    "path": path,
                    "exists": True,
                    "columns": list(df.columns),
                    "file_size_mb": round(os.path.getsize(path) / (1024*1024), 2)
                }
            else:
                info[data_type] = {"path": path, "exists": False}
        except Exception as e:
            info[data_type] = {"path": path, "exists": False, "error": str(e)}
    
    return {"success": True, "datasets": info}

@app.post("/train/forecast")
async def train_forecast_model():
    """Train demand forecasting model"""
    if forecaster is None:
        raise HTTPException(status_code=500, detail="Forecaster not initialized")
    
    try:
        df = load_data("forecasting")
        success = forecaster.fit(df)
        
        if success:
            metrics = forecaster.get_metrics(df.tail(1000))  # Test on last 1000 rows
            return TrainingResponse(
                success=True,
                message="Demand forecasting model trained successfully",
                metrics=metrics
            )
        else:
            return TrainingResponse(
                success=False,
                message="Failed to train demand forecasting model"
            )
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")

@app.post("/train/pricing")
async def train_pricing_model():
    """Train dynamic pricing model"""
    if pricer is None:
        raise HTTPException(status_code=500, detail="Pricer not initialized")
    
    try:
        df = load_data("pricing")
        success = pricer.fit(df)
        
        if success:
            metrics = pricer.get_metrics(df.tail(1000))
            return TrainingResponse(
                success=True,
                message="Dynamic pricing model trained successfully",
                metrics=metrics
            )
        else:
            return TrainingResponse(
                success=False,
                message="Failed to train dynamic pricing model"
            )
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")

@app.post("/train/anomaly")
async def train_anomaly_model():
    """Train anomaly detection model"""
    if anomaly_detector is None:
        raise HTTPException(status_code=500, detail="Anomaly detector not initialized")
    
    try:
        df = load_data("anomaly")
        success = anomaly_detector.fit(df)
        
        if success:
            metrics = anomaly_detector.get_metrics(df.tail(1000))
            return TrainingResponse(
                success=True,
                message="Anomaly detection model trained successfully",
                metrics=metrics
            )
        else:
            return TrainingResponse(
                success=False,
                message="Failed to train anomaly detection model"
            )
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")

@app.post("/train/optimization")
async def train_optimization_model():
    """Train energy optimization model"""
    if optimizer is None:
        raise HTTPException(status_code=500, detail="Optimizer not initialized")
    
    try:
        df = load_data("optimization")
        success = optimizer.fit(df)
        
        if success:
            metrics = optimizer.get_metrics(df.tail(1000))
            return TrainingResponse(
                success=True,
                message="Energy optimization model trained successfully",
                metrics=metrics
            )
        else:
            return TrainingResponse(
                success=False,
                message="Failed to train energy optimization model"
            )
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")

@app.post("/train/all")
async def train_all_models():
    """Train all models"""
    results = {}
    
    # Train forecasting model
    try:
        df = load_data("forecasting")
        success = forecaster.fit(df) if forecaster else False
        results["forecasting"] = {"success": success}
        if success:
            metrics = forecaster.get_metrics(df.tail(1000))
            results["forecasting"]["metrics"] = clean_for_json(metrics)
    except Exception as e:
        results["forecasting"] = {"success": False, "error": str(e)}
    
    # Train pricing model
    try:
        df = load_data("pricing")
        success = pricer.fit(df) if pricer else False
        results["pricing"] = {"success": success}
        if success:
            metrics = pricer.get_metrics(df.tail(1000))
            results["pricing"]["metrics"] = clean_for_json(metrics)
    except Exception as e:
        results["pricing"] = {"success": False, "error": str(e)}
    
    # Train anomaly model
    try:
        df = load_data("anomaly")
        success = anomaly_detector.fit(df) if anomaly_detector else False
        results["anomaly"] = {"success": success}
        if success:
            metrics = anomaly_detector.get_metrics(df.tail(1000))
            results["anomaly"]["metrics"] = clean_for_json(metrics)
    except Exception as e:
        results["anomaly"] = {"success": False, "error": str(e)}
    
    # Train optimization model
    try:
        df = load_data("optimization")
        success = optimizer.fit(df) if optimizer else False
        results["optimization"] = {"success": success}
        if success:
            metrics = optimizer.get_metrics(df.tail(1000))
            results["optimization"]["metrics"] = clean_for_json(metrics)
    except Exception as e:
        results["optimization"] = {"success": False, "error": str(e)}
    
    overall_success = all(result.get("success", False) for result in results.values())
    
    return clean_for_json({
        "success": overall_success,
        "message": "All models trained" if overall_success else "Some models failed to train",
        "results": results
    })

@app.post("/predict/forecast", response_model=PredictionResponse)
async def predict_demand(energy_data: List[EnergyData]):
    """Predict energy demand"""
    if forecaster is None:
        raise HTTPException(status_code=500, detail="Forecaster not initialized")
    
    try:
        df = prepare_input_data(energy_data)
        predictions = forecaster.predict(df)
        
        return PredictionResponse(
            success=True,
            predictions=predictions,
            metadata={"model": "demand_forecasting", "num_predictions": len(predictions)}
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

@app.post("/predict/pricing", response_model=PredictionResponse)
async def predict_pricing(energy_data: List[EnergyData]):
    """Predict dynamic pricing"""
    if pricer is None:
        raise HTTPException(status_code=500, detail="Pricer not initialized")
    
    try:
        df = prepare_input_data(energy_data)
        predictions = pricer.predict(df)
        
        return PredictionResponse(
            success=True,
            predictions=predictions,
            metadata={"model": "dynamic_pricing", "num_predictions": len(predictions)}
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

@app.post("/predict/anomaly", response_model=PredictionResponse)
async def predict_anomaly(energy_data: List[EnergyData]):
    """Detect anomalies"""
    if anomaly_detector is None:
        raise HTTPException(status_code=500, detail="Anomaly detector not initialized")
    
    try:
        df = prepare_input_data(energy_data)
        predictions = anomaly_detector.predict(df)
        scores = anomaly_detector.get_anomaly_scores(df)
        
        # Create anomaly flags for each prediction
        anomaly_flags = ["anomaly" if pred == 1 else "normal" for pred in predictions]
        
        # Convert numpy types to Python types for JSON serialization
        scores_list = [float(score) for score in scores] if scores else []
        threshold_value = float(anomaly_detector.threshold) if anomaly_detector.threshold else None
        
        return PredictionResponse(
            success=True,
            predictions=predictions,
            metadata={
                "model": "anomaly_detection", 
                "num_predictions": len(predictions),
                "anomaly_scores": scores_list[:10],  # First 10 scores
                "anomaly_flags": anomaly_flags,  # Clear flag indicating anomaly or normal
                "threshold": threshold_value
            }
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

@app.post("/predict/optimization")
async def predict_optimization(energy_data: List[EnergyData]):
    """Get energy optimization recommendations"""
    if optimizer is None:
        raise HTTPException(status_code=500, detail="Optimizer not initialized")
    
    try:
        df = prepare_input_data(energy_data)
        predictions = optimizer.predict(df)
        optimization_results = optimizer.optimize(df)
        
        return {
            "success": True,
            "predictions": predictions,
            "optimization": optimization_results,
            "metadata": {"model": "energy_optimization", "num_predictions": len(predictions)}
        }
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

@app.get("/metrics/all", response_model=MetricsResponse)
async def get_all_metrics():
    """Get performance metrics for all models"""
    try:
        metrics = {}
        
        # Get sample data for metrics calculation
        for model_type in ["forecasting", "pricing", "anomaly", "optimization"]:
            try:
                df = load_data(model_type)
                sample_df = df.tail(1000)  # Use last 1000 rows
                
                if model_type == "forecasting" and forecaster:
                    metrics["forecasting"] = forecaster.get_metrics(sample_df)
                elif model_type == "pricing" and pricer:
                    metrics["pricing"] = pricer.get_metrics(sample_df)
                elif model_type == "anomaly" and anomaly_detector:
                    metrics["anomaly"] = anomaly_detector.get_metrics(sample_df)
                elif model_type == "optimization" and optimizer:
                    metrics["optimization"] = optimizer.get_metrics(sample_df)
                    
            except Exception as e:
                metrics[model_type] = {"error": str(e)}
        
        return MetricsResponse(success=True, metrics=metrics)
        
    except Exception as e:
        logger.error(f"Metrics calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Metrics calculation failed: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": str(pd.Timestamp.now()),
        "models_loaded": {
            "forecaster": forecaster is not None,
            "pricer": pricer is not None,
            "anomaly_detector": anomaly_detector is not None,
            "optimizer": optimizer is not None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
