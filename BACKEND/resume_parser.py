import PyPDF2
from docx import Document
import re

class ResumeParser:
    def parse(self, filepath):
        """Parse resume file and extract information"""
        extension = filepath.split('.')[-1].lower()
        
        if extension == 'pdf':
            text = self._parse_pdf(filepath)
        elif extension == 'docx':
            text = self._parse_docx(filepath)
        else:
            text = self._parse_txt(filepath)
        
        # Extract structured data
        data = {
            'raw_text': text,
            'name': self._extract_name(text),
            'email': self._extract_email(text),
            'phone': self._extract_phone(text),
            'skills': self._extract_skills(text),
            'experience': self._extract_section(text, 'experience'),
            'education': self._extract_section(text, 'education')
        }
        
        return data
    
    def _parse_pdf(self, filepath):
        """Extract text from PDF"""
        text = ""
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        return text
    
    def _parse_docx(self, filepath):
        """Extract text from DOCX"""
        doc = Document(filepath)
        return '\n'.join([para.text for para in doc.paragraphs])
    
    def _parse_txt(self, filepath):
        """Extract text from TXT"""
        with open(filepath, 'r', encoding='utf-8') as file:
            return file.read()
    
    def _extract_email(self, text):
        """Extract email address"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        return emails[0] if emails else ''
    
    def _extract_phone(self, text):
        """Extract phone number"""
        phone_pattern = r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]'
        phones = re.findall(phone_pattern, text)
        return phones[0] if phones else ''
    
    def _extract_name(self, text):
        """Extract name (first line typically)"""
        lines = text.strip().split('\n')
        for line in lines[:5]:
            line = line.strip()
            if len(line) > 3 and len(line) < 50:
                # Basic name validation
                if not re.search(r'[@\d]', line):
                    return line
        return ''
    
    def _extract_skills(self, text):
        """Extract skills"""
        # Common programming/technical skills
        common_skills = [
            'python', 'java', 'javascript', 'react', 'node', 'sql',
            'html', 'css', 'mongodb', 'postgresql', 'aws', 'docker',
            'kubernetes', 'git', 'agile', 'machine learning', 'ai',
            'data analysis', 'tableau', 'excel', 'powerbi'
        ]
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in common_skills:
            if skill in text_lower:
                found_skills.append(skill.title())
        
        return found_skills
    
    def _extract_section(self, text, section_name):
        """Extract specific section from resume"""
        text_lower = text.lower()
        
        # Find section start
        section_patterns = {
            'experience': ['experience', 'work history', 'employment'],
            'education': ['education', 'academic', 'qualification']
        }
        
        patterns = section_patterns.get(section_name, [section_name])
        
        for pattern in patterns:
            start_idx = text_lower.find(pattern)
            if start_idx != -1:
                # Find next section or end
                end_idx = len(text)
                for other_section in ['experience', 'education', 'skills', 'projects']:
                    if other_section != section_name:
                        next_section_idx = text_lower.find(other_section, start_idx + len(pattern))
                        if next_section_idx != -1 and next_section_idx < end_idx:
                            end_idx = next_section_idx
                
                section_text = text[start_idx:end_idx].strip()
                return section_text[:500]  # Limit length
        
        return ''