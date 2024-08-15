FROM bitnami/minideb:latest

# Copy the sysinit directory to a temporary location
COPY deps/sysinit /tmp/sysinit

# Install required packages, set up the environment, copy configuration files, and clean up
RUN install_packages ca-certificates zsh git curl neovim bash rustc cargo protobuf-compiler && \
    (curl -fsSL https://starship.rs/install.sh | sh -s -- --yes) && \
    cargo install macchina --locked && \
    (curl --proto '=https' --tlsv1.2 -LsSf https://setup.atuin.sh | sh) && \
    chsh -s /bin/zsh && \
    mkdir -p /root/.config/atuin /root/.config/macchina /root/.config/macchina/themes /root/.config/nvim && \
    cp /tmp/sysinit/atuin/config.toml /root/.config/atuin/config.toml && \
    cp /tmp/sysinit/zsh/.zshrc.alpine /root/.zshrc && \
    cp /tmp/sysinit/starship/starship.toml /root/.config/starship.toml && \
    cp /tmp/sysinit/macchina/themes/rosh.ascii /root/.config/macchina/themes/rosh.ascii && \
    cp /tmp/sysinit/macchina/themes/rosh.toml /root/.config/macchina/themes/rosh.toml && \
    cp -r /tmp/sysinit/grugnvim /root/.config/nvim && \
    rm -rf /tmp/sysinit && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    rm -rf /root/.cargo/registry && \
    rm -rf /root/.cargo/git

# Set the working directory
WORKDIR /root

# Start Zsh interactively when the container launches
CMD ["zsh"]