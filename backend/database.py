'''
Set up the RAG system. Takes in a document and then converts to embeddings 
and then pushes embeddings into vector storage.   
Then, does RAG query. 
'''
from fastapi import FastAPI, HTTPException, UploadFile, File 
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional 
from pydantic import BaseModel 
from llama_index.core import SimpleDirectoryReader, StorageContext
from llama_index.core import VectorStoreIndex
from llama_index.vector_stores.supabase import SupabaseVectorStore 
import textwrap
import openai 
import tempfile 
import uuid 
import os 
from dotenv import load_dotenv 
load_dotenv()
from pathlib import Path
import shutil

app = FastAPI() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # TODO: add production URL 
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


DB_CONNECTION = f'postgresql://postgres.dvacbhcmfrsyxrtyzgei:{os.environ.get("AWS_PASSWORD")}@aws-0-us-west-1.pooler.supabase.com:6543/postgres'

BASE_UPLOAD_DIR = "/tmp/uploaded_documents"

class QueryRequest(BaseModel):
    query_text: str

class QueryResponse(BaseModel):
    response: str
    source_documents: Optional[List[str]] = None 

global_index = None 


def setup_postgres_vector_store():
    '''
    Initialize postgres with pgvector 
    '''
    try:
        vector_store = SupabaseVectorStore(
            postgres_connection_string=DB_CONNECTION,
            collection_name='debate_files'
        )
        return vector_store 
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to setup vector store: {str(e)}")


def create_rag_application(data_directory: str):
    '''Creates and returns RAG index'''
    try: 
        documents = SimpleDirectoryReader(data_directory).load_data()
        
        vector_store = setup_postgres_vector_store()

        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        index = VectorStoreIndex.from_documents(documents, storage_context=storage_context)

        return index
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to setup index: {str(e)}")

@app.post('/upload/', status_code=201)
async def upload_files(files: List[UploadFile] = File(...)):
    '''
    Take a list of PDF files and initialize the RAG index; create a temp local directory 
        for each uploaded files
    '''
    unique_dir = os.path.join(BASE_UPLOAD_DIR, str(uuid.uuid4()))
    os.makedirs(unique_dir)

    try:
        # save and process files
        saved_files = []
        for file in files:
            if file.filename.endswith('.pdf'):
                file_path = Path(unique_dir) / file.filename

                with open(file_path, 'wb') as buffer:
                    shutil.copyfileobj(file.file, buffer)
                saved_files.append(file_path)

        # initalize our rag index
        global global_index 
        global_index = create_rag_application(unique_dir)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload files. {str(e)}"
        )
    
    finally:
        if os.path.exists(unique_dir):
            shutil.rmtree(unique_dir)
    
def query_rag_system(index, query_text):
    '''Queries RAG system'''
    query_engine = index.as_query_engine()

    response = query_engine.query(query_text)

    return response 


def query_no_files(query_text):
    raise NotImplementedError("Haven't implemented non-rag response")
    pass 

@app.post("/query/", response_model=QueryResponse)
def driver(query: QueryRequest):
    if global_index is None:
        try:
            query_no_files(query.query_text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f'Query without RAG files failed: {str(e)}')
    
    try:
        response = query_rag_system(global_index, query.query_text)
        print(f"Reponse: {response}")
        return QueryResponse(response=str(response), 
            source_documents=[str(source) for source in response.source_nodes] if hasattr(response, 'source_nodes') else None )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


# health check endpoint for railway
@app.get("/health")
async def health_check():
    '''Health check endpoint'''
    return {'status': "healthy"}


       







