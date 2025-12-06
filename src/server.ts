const address = await server.listen({ port: 3000, host: '0.0.0.0' });
console.log(`Server listening on ${address}`);

// Initialize WhatsApp Connection
const wa = new WhatsAppService();
await wa.connect();
    } catch (err) {
    server.log.error(err);
    process.exit(1);
}
};

start();
