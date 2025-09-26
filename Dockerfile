FROM ybor/vscode:latest

RUN apt-get update && \
    apt-get install -y build-essential git curl net-tools && \
    rm -rf /var/lib/apt/lists/*

RUN wget -qO - https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs gcc g++ make && \
    rm -rf /var/lib/apt/lists/* && \
    npm install -g yarn