FROM python:3.7-alpine
ADD . /api
WORKDIR /api
RUN pip install -r requirements.txt
CMD ["python", "app.py"]