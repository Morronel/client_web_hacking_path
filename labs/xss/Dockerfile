FROM python:3.11-slim
WORKDIR /app
COPY wheels/ /tmp/wheels/
RUN pip install --no-cache-dir --no-index --find-links=/tmp/wheels flask && rm -rf /tmp/wheels
COPY . .
EXPOSE 5002
CMD ["python", "app.py"]
