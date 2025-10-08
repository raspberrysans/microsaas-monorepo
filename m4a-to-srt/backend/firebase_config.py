import os
import json
import firebase_admin
from firebase_admin import credentials, auth, firestore
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if Firebase is already initialized
        firebase_admin.get_app()
        logger.info("Firebase already initialized")
    except ValueError:
        # Firebase not initialized, so initialize it
        try:
            # Try to get service account from environment variable (JSON string)
            service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
            if service_account_json:
                service_account_info = json.loads(service_account_json)
                cred = credentials.Certificate(service_account_info)
                logger.info("Using Firebase service account from environment variable")
            else:
                # Try to get service account from file path
                service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
                if service_account_path and os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    logger.info(f"Using Firebase service account from file: {service_account_path}")
                else:
                    # Use default credentials (for Google Cloud environments)
                    cred = credentials.ApplicationDefault()
                    logger.info("Using Firebase default credentials")
            
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise

def get_firestore_client():
    """Get Firestore client"""
    try:
        return firestore.client()
    except Exception as e:
        logger.error(f"Failed to get Firestore client: {e}")
        raise

async def verify_firebase_token(token: str) -> Optional[dict]:
    """Verify Firebase ID token and return user info"""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Failed to verify Firebase token: {e}")
        return None

async def get_user_data(uid: str) -> Optional[dict]:
    """Get user data from Firestore"""
    try:
        db = get_firestore_client()
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            return user_doc.to_dict()
        else:
            logger.warning(f"User document not found for UID: {uid}")
            return None
    except Exception as e:
        logger.error(f"Failed to get user data: {e}")
        return None

async def increment_user_usage(uid: str):
    """Increment user's conversion usage count"""
    try:
        db = get_firestore_client()
        user_ref = db.collection('users').document(uid)
        
        # Use transaction to safely increment
        from google.cloud.firestore import firestore as fs
        @fs.transactional
        def update_usage(transaction, user_ref):
            user_doc = user_ref.get(transaction=transaction)
            if user_doc.exists:
                current_usage = user_doc.to_dict().get('conversionsUsed', 0)
                transaction.update(user_ref, {
                    'conversionsUsed': current_usage + 1,
                    'lastConversionAt': fs.SERVER_TIMESTAMP
                })
            else:
                # Create user document if it doesn't exist
                transaction.set(user_ref, {
                    'conversionsUsed': 1,
                    'lastConversionAt': fs.SERVER_TIMESTAMP,
                    'isAdmin': False
                })
        
        transaction = db.transaction()
        update_usage(transaction, user_ref)
        logger.info(f"Incremented usage for user: {uid}")
        
    except Exception as e:
        logger.error(f"Failed to increment user usage: {e}")
        raise

def can_user_convert(user_data: dict, is_admin: bool = False) -> bool:
    """Check if user can perform conversion"""
    if is_admin:
        return True
    
    max_free_conversions = 2
    conversions_used = user_data.get('conversionsUsed', 0)
    
    return conversions_used < max_free_conversions
