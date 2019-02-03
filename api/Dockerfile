FROM python:3.6-alpine
ADD . /api
WORKDIR /api
RUN pip install -r requirements.txt
CMD ["python", "app.py"]