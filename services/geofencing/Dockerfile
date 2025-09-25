FROM python:3.11-slim
WORKDIR /app
RUN pip install fastapi uvicorn shapely pydantic[dotenv]
COPY app /app
EXPOSE 8051
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8051"]
