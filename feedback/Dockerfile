FROM python:3.6-alpine
ADD . /feedback
WORKDIR /feedback
# RUN apk update && apk add postgresql-dev gcc python3-dev musl-dev
RUN pip install -r requirements.txt
CMD ["python", "feedback_bot.py"]