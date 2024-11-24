import fitz  # PyMuPDF
from typing import List, Tuple
from dataclasses import dataclass

@dataclass
class FormattedText:
    """Class to store formatted text with its properties"""
    text: str
    page_num: int
    y_pos: float
    format_type: str  # 'bold' or 'highlight'

def extract_formatted_text_in_order(pdf_path: str) -> List[FormattedText]:
    """
    Extract bold and highlighted text from a PDF file while preserving their order.
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        List[FormattedText]: List of formatted text in reading order
    """
    # Initialize result list
    formatted_texts = []
    
    # Open PDF document
    doc = fitz.open(pdf_path)
    
    # Process each page
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Extract bold text
        for block in page.get_text("dict")["blocks"]:
            if "lines" in block:
                for line in block["lines"]:
                    for span in line["spans"]:
                        # Check if text is bold (font flags)
                        if span["flags"] & 2**4:  # Test bold flag
                            formatted_texts.append(FormattedText(
                                text=span["text"].strip(),
                                page_num=page_num,
                                y_pos=span["origin"][1],  # y-coordinate
                                format_type='bold'
                            ))
        
        # Extract highlighted text
        for highlight in page.annots():
            if highlight.type[0] == 8:  # Highlight annotation
                highlight_rect = highlight.rect
                words = page.get_text("words", clip=highlight_rect)
                if words:
                    highlighted_text = " ".join(word[4] for word in words)
                    if highlighted_text.strip():
                        formatted_texts.append(FormattedText(
                            text=highlighted_text.strip(),
                            page_num=page_num,
                            y_pos=highlight_rect.y0,  # y-coordinate of highlight
                            format_type='highlight'
                        ))
    
    # Close the document
    doc.close()
    
    # Sort by page number and then by y-position
    formatted_texts.sort(key=lambda x: (x.page_num, x.y_pos))
    return formatted_texts

def print_formatted_text_in_order(formatted_texts: List[FormattedText]) -> None:
    """
    Print the extracted text in reading order with formatting indicators.
    
    Args:
        formatted_texts (List[FormattedText]): List of formatted text entries
    """
    current_page = -1
    
    for idx, text in enumerate(formatted_texts, 1):
        # Print page number when it changes
        if text.page_num != current_page:
            current_page = text.page_num
            print(f"\nPage {current_page + 1}")
            print("-" * 50)
        
        # Print text with format indicator
        format_indicator = "[BOLD]" if text.format_type == 'bold' else "[HIGHLIGHT]"
        print(f"{idx}. {format_indicator} {text.text}")

def save_to_file(formatted_texts: List[FormattedText], output_path: str) -> None:
    """
    Save the extracted text to a file.
    
    Args:
        formatted_texts (List[FormattedText]): List of formatted text entries
        output_path (str): Path to save the output file
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        current_page = -1
        
        for idx, text in enumerate(formatted_texts, 1):
            if text.page_num != current_page:
                current_page = text.page_num
                f.write(f"\nPage {current_page + 1}\n")
                f.write("-" * 50 + "\n")
            
            format_indicator = "[BOLD]" if text.format_type == 'bold' else "[HIGHLIGHT]"
            f.write(f"{idx}. {format_indicator} {text.text}\n")

# Example usage
if __name__ == "__main__":
    pdf_path = "/Users/justin/Desktop/Everything/Code/debateacademy/test_local_files/radicalism_neg_speech.pdf"
    output_path = "extracted_text.txt"
    
    # Extract text
    formatted_texts = extract_formatted_text_in_order(pdf_path)
    
    # Print to console
    print_formatted_text_in_order(formatted_texts)
    