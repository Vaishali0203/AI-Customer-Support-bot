FROM python:3.10-slim

WORKDIR /app

COPY . /app

# Install Chromium and ChromeDriver for Selenium
RUN apt-get update && apt-get install -y \
    cron \
    wget \
    unzip \
    curl \
    chromium \
    chromium-driver \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

COPY crontab.txt /etc/cron.d/scrape-cron
RUN chmod 0644 /etc/cron.d/scrape-cron
RUN crontab /etc/cron.d/scrape-cron
RUN touch /var/log/cron.log

CMD cron && tail -f /var/log/cron.log 