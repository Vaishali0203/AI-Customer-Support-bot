FROM python:3.10-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt && \
    apt-get update && apt-get install -y cron

COPY crontab.txt /etc/cron.d/scrape-cron
RUN chmod 0644 /etc/cron.d/scrape-cron
RUN crontab /etc/cron.d/scrape-cron
RUN touch /var/log/cron.log

CMD cron && tail -f /var/log/cron.log 