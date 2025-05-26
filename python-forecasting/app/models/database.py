import os
import pandas as pd
import psycopg2
from sqlalchemy import create_engine, text
from typing import Optional, List, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            logger.error("DATABASE_URL environment variable not found")
            raise ValueError("DATABASE_URL environment variable is required")
        
        logger.info(f"Database URL configured: {self.database_url[:50]}...")
        
        try:
            # Create SQLAlchemy engine with connection pooling
            self.engine = create_engine(
                self.database_url,
                pool_pre_ping=True,  # Verify connections before use
                pool_recycle=300,    # Recycle connections every 5 minutes
                echo=False           # Set to True for SQL debugging
            )
            logger.info("Database engine created successfully")
        except Exception as e:
            logger.error(f"Failed to create database engine: {e}")
            raise
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            logger.info("Testing database connection...")
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1 as test"))
                test_result = result.fetchone()
                if test_result and test_result[0] == 1:
                    logger.info("✅ Database connection successful")
                    return True
                else:
                    logger.error("❌ Database connection test failed - unexpected result")
                    return False
        except Exception as e:
            logger.error(f"❌ Database connection test failed: {e}")
            logger.error(f"Database URL: {self.database_url[:50]}...")
            return False
    
    def get_dispensing_data(self, unit_id: Optional[int] = None, medicine_id: Optional[int] = None) -> pd.DataFrame:
        """Get dispensing data for forecasting"""
        try:
            logger.info(f"Fetching dispensing data for unit_id={unit_id}, medicine_id={medicine_id}")
            
            # Test connection first
            if not self.test_connection():
                logger.error("Database connection failed, cannot fetch data")
                return pd.DataFrame()
            
            # Base query - matches your schema exactly
            query = """
            SELECT 
                p."tanggalSah",
                rp."banyak",
                p."unitId",
                rp."persediaanId"
            FROM "dbo"."Pengeluaran" p
            INNER JOIN "dbo"."RincianPengeluaran" rp ON p.id = rp."pengeluaranId"
            WHERE p."tanggalSah" IS NOT NULL
            """
            
            params = {}
            
            if unit_id is not None:
                query += ' AND p."unitId" = %(unit_id)s'
                params['unit_id'] = unit_id
            
            if medicine_id is not None:
                query += ' AND rp."persediaanId" = %(medicine_id)s'
                params['medicine_id'] = medicine_id
            
            query += ' ORDER BY p."tanggalSah" ASC'
            
            logger.info(f"Executing query: {query}")
            logger.info(f"With parameters: {params}")
            
            with self.engine.connect() as conn:
                df = pd.read_sql(query, conn, params=params)
            
            logger.info(f"✅ Retrieved {len(df)} records")
            return df
            
        except Exception as e:
            logger.error(f"❌ Error fetching dispensing data: {e}")
            return pd.DataFrame()
    
    def get_available_units(self) -> List[Dict[str, Any]]:
        """Get list of units with dispensing data"""
        try:
            logger.info("Fetching available units...")
            
            # Test connection first
            if not self.test_connection():
                logger.error("Database connection failed, cannot fetch units")
                return []
            
            query = """
            SELECT DISTINCT 
                u.id,
                u."namaUnit",
                u."kodeUnit"
            FROM "dbo"."Unit" u
            INNER JOIN "dbo"."Pengeluaran" p ON u.id = p."unitId"
            INNER JOIN "dbo"."RincianPengeluaran" rp ON p.id = rp."pengeluaranId"
            WHERE u.temp = false
            ORDER BY u."namaUnit"
            """
            
            with self.engine.connect() as conn:
                df = pd.read_sql(query, conn)
            
            logger.info(f"✅ Found {len(df)} units")
            return df.to_dict('records')
            
        except Exception as e:
            logger.error(f"❌ Error fetching units: {e}")
            return []
    
    def get_available_medicines(self, unit_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get list of medicines with dispensing data"""
        try:
            logger.info(f"Fetching available medicines for unit_id={unit_id}")
            
            # Test connection first
            if not self.test_connection():
                logger.error("Database connection failed, cannot fetch medicines")
                return []
            
            query = """
            SELECT DISTINCT 
                pers.id,
                pers."namaPersediaan",
                pers."kodePersediaan"
            FROM "dbo"."Persediaan" pers
            INNER JOIN "dbo"."RincianPengeluaran" rp ON pers.id = rp."persediaanId"
            INNER JOIN "dbo"."Pengeluaran" p ON rp."pengeluaranId" = p.id
            WHERE pers.temp = false
            """
            
            params = {}
            
            if unit_id is not None:
                query += ' AND p."unitId" = %(unit_id)s'
                params['unit_id'] = unit_id
            
            query += ' ORDER BY pers."namaPersediaan"'
            
            with self.engine.connect() as conn:
                df = pd.read_sql(query, conn, params=params)
            
            logger.info(f"✅ Found {len(df)} medicines")
            return df.to_dict('records')
            
        except Exception as e:
            logger.error(f"❌ Error fetching medicines: {e}")
            return []

# Global database instance
try:
    db = DatabaseManager()
    logger.info("Database manager initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize database manager: {e}")
    db = None
