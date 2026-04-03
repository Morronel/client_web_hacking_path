FROM python:3.11-slim
WORKDIR /app
COPY wheels/ /tmp/wheels/
RUN pip install --no-cache-dir --no-index --find-links=/tmp/wheels flask && rm -rf /tmp/wheels
# Create stub commands that the lab expects (real commands not needed for injection exploits)
RUN printf '#!/bin/sh\necho "PING $1: 64 bytes from $1: icmp_seq=1 ttl=64 time=0.1 ms"\n' > /usr/local/bin/ping && chmod +x /usr/local/bin/ping && \
    printf '#!/bin/sh\necho "Server: stub\nAddress: 127.0.0.1\nName: $1\nAddress: 93.184.216.34"\n' > /usr/local/bin/nslookup && chmod +x /usr/local/bin/nslookup && \
    printf '#!/bin/sh\necho "traceroute to $1, 30 hops max\n 1  gateway  0.5ms  0.4ms  0.3ms"\n' > /usr/local/bin/traceroute && chmod +x /usr/local/bin/traceroute && \
    printf '#!/bin/sh\necho "Domain Name: $1\nRegistrar: NeonCorp"\n' > /usr/local/bin/whois && chmod +x /usr/local/bin/whois
COPY . .
EXPOSE 5011
CMD ["python", "app.py"]
