FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Cria o grupo e o usuário interno do Linux no contêiner
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Define a permissão das pastas para esse usuário interno
COPY --chown=appuser:appgroup . /app

# Altera a execução para o usuário sem privilégios
USER appuser

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]