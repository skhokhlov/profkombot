FROM python:3.6-alpine
ADD . /api
WORKDIR /api
RUN apk update && apk add postgresql-dev gcc python3-dev musl-dev
RUN pip install -r requirements.txt
CMD ["python", "app.py"]