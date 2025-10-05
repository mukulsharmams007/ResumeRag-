from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
import json
import os

class ResumeRAG:
    def __init__(self):
        # Use free HuggingFace embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Initialize vector stores
        self.resume_db = Chroma(
            collection_name="resumes",
            embedding_function=self.embeddings,
            persist_directory="../vectordb/resumes"
        )
        
        self.job_db = Chroma(
            collection_name="jobs",
            embedding_function=self.embeddings,
            persist_directory="../vectordb/jobs"
        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
    
    def add_resume(self, resume_data, filename):
        """Add resume to vector database"""
        # Combine all resume fields into searchable text
        text = f"""
        Name: {resume_data.get('name', '')}
        Email: {resume_data.get('email', '')}
        Phone: {resume_data.get('phone', '')}
        Skills: {', '.join(resume_data.get('skills', []))}
        Experience: {resume_data.get('experience', '')}
        Education: {resume_data.get('education', '')}
        """
        
        # Create document
        doc = Document(
            page_content=text,
            metadata={
                'filename': filename,
                'name': resume_data.get('name', ''),
                'email': resume_data.get('email', ''),
                'skills': resume_data.get('skills', []),
                'type': 'resume'
            }
        )
        
        # Add to vector store
        self.resume_db.add_documents([doc])
        self.resume_db.persist()
    
    def add_job(self, job_data):
        """Add job posting to vector database"""
        text = f"""
        Title: {job_data.get('title', '')}
        Company: {job_data.get('company', '')}
        Location: {job_data.get('location', '')}
        Description: {job_data.get('description', '')}
        Requirements: {job_data.get('requirements', '')}
        """
        
        doc = Document(
            page_content=text,
            metadata={
                'title': job_data.get('title', ''),
                'company': job_data.get('company', ''),
                'location': job_data.get('location', ''),
                'type': 'job'
            }
        )
        
        self.job_db.add_documents([doc])
        self.job_db.persist()
    
    def search_resumes(self, job_description, top_k=5):
        """Search for matching resumes"""
        results = self.resume_db.similarity_search_with_score(
            job_description,
            k=top_k
        )
        
        matches = []
        for doc, score in results:
            matches.append({
                'filename': doc.metadata.get('filename'),
                'name': doc.metadata.get('name'),
                'email': doc.metadata.get('email'),
                'skills': doc.metadata.get('skills', []),
                'match_score': float(1 - score),  # Convert distance to similarity
                'preview': doc.page_content[:200]
            })
        
        return matches
    
    def match_jobs(self, resume_text, top_k=5):
        """Find matching jobs for resume"""
        results = self.job_db.similarity_search_with_score(
            resume_text,
            k=top_k
        )
        
        matches = []
        for doc, score in results:
            matches.append({
                'title': doc.metadata.get('title'),
                'company': doc.metadata.get('company'),
                'location': doc.metadata.get('location'),
                'match_score': float(1 - score),
                'description': doc.page_content[:300]
            })
        
        return matches
    
    def analyze_resume(self, resume_text):
        """Analyze resume and provide insights"""
        # Simple analysis (can be enhanced with LLM)
        analysis = {
            'word_count': len(resume_text.split()),
            'has_contact': any(x in resume_text.lower() for x in ['email', 'phone', '@']),
            'sections_found': [],
            'suggestions': []
        }
        
        # Check for common sections
        sections = ['experience', 'education', 'skills', 'projects']
        for section in sections:
            if section in resume_text.lower():
                analysis['sections_found'].append(section)
        
        # Provide suggestions
        if 'experience' not in analysis['sections_found']:
            analysis['suggestions'].append('Consider adding an Experience section')
        if 'skills' not in analysis['sections_found']:
            analysis['suggestions'].append('Add a Skills section to highlight your abilities')
        
        return analysis