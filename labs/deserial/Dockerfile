FROM python:3.11-slim
WORKDIR /app
COPY wheels/ /tmp/wheels/
RUN pip install --no-cache-dir --no-index --find-links=/tmp/wheels flask pyyaml  && rm -rf /tmp/wheels
COPY . .
EXPOSE 5014
CMD ["python", "app.py"]
