# Use lightweight Python image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /code

# Copy and install dependencies first (for efficient docker caching)
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of your application code
COPY . /code

# Hugging Face Spaces requires apps to run on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]