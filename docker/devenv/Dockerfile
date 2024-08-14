FROM amd64/alpine:latest

# Install required packages
RUN apk add --no-cache zsh git curl wget nodejs npm

# Install Oh My Zsh
RUN sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"

# Set Zsh as the default shell
RUN sed -i -e "s/bin\/ash/bin\/zsh/" /etc/passwd

# Install necessary fonts for the agnoster theme
RUN apk add --no-cache font-noto-emoji

# Set up Zsh configuration
RUN echo 'export TERM="xterm-256color"' >> ~/.zshrc && \
    echo 'ZSH_THEME="agnoster"' >> ~/.zshrc && \
    echo 'plugins=(git)' >> ~/.zshrc

# Set the working directory
WORKDIR /root

# Start Zsh interactively when the container launches
CMD ["zsh", "-i"]