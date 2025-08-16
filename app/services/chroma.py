import os
import time
from typing import List

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.schema import Document

# Load environment variables
load_dotenv()

class ChromaService:
    """Service for managing Chroma vectorstore connections with automatic recovery"""
    
    def __init__(self):
        self.top_dir = os.environ.get("TOP_DIR")
        self.chroma_dir_path = os.path.join(self.top_dir, os.environ.get("CHROMA_DIR"))
        self._vectorstore = None
    
    def _create_vectorstore(self):
        """Create a new Chroma vectorstore instance"""
        try:
            print("Creating new Chroma vectorstore connection...")
            return Chroma(
                persist_directory=self.chroma_dir_path, 
                embedding_function=OpenAIEmbeddings()
            )
        except Exception as e:
            print(f"Error creating Chroma vectorstore: {e}")
            raise
    
    def _get_vectorstore(self):
        """Get or create the Chroma vectorstore"""
        if self._vectorstore is None:
            self._vectorstore = self._create_vectorstore()
        return self._vectorstore
    
    def _reset_connection(self):
        """Reset the vectorstore to force recreation"""
        self._vectorstore = None
    
    def _execute_with_retry(self, operation, max_retries=3, delay=1):
        """Execute a Chroma operation with retry logic for connection recovery"""
        for attempt in range(max_retries):
            try:
                vectorstore = self._get_vectorstore()
                return operation(vectorstore)
                
            except Exception as e:
                error_msg = str(e).lower()
                
                # Check if it's a connection-related error
                is_connection_error = any(keyword in error_msg for keyword in [
                    'connection', 'timeout', 'network', 'unreachable', 
                    'refused', 'broken pipe', 'closed', 'reset', 'sqlite'
                ])
                
                if is_connection_error and attempt < max_retries - 1:
                    print(f"Connection error detected (attempt {attempt + 1}/{max_retries}): {e}")
                    print("Resetting vectorstore and retrying...")
                    
                    # Reset the vectorstore to force recreation
                    self._reset_connection()
                    
                    # Wait before retrying with exponential backoff
                    time.sleep(delay * (attempt + 1))
                    continue
                else:
                    # If it's not a connection error or max retries reached, re-raise
                    print(f"Chroma operation failed after {attempt + 1} attempts: {e}")
                    raise
    
    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Perform similarity search with automatic retry on connection errors"""
        def search_operation(vectorstore):
            return vectorstore.similarity_search(query, k=k)
        
        return self._execute_with_retry(search_operation)
    
    def similarity_search_with_score(self, query: str, k: int = 4) -> List[tuple]:
        """Perform similarity search with scores and automatic retry on connection errors"""
        def search_operation(vectorstore):
            return vectorstore.similarity_search_with_score(query, k=k)
        
        return self._execute_with_retry(search_operation)

# Global service instance
chroma_service = ChromaService() 