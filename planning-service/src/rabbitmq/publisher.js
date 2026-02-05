const amqp = require('amqplib');

class RabbitMQPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost');
      this.channel = await this.connection.createChannel();
      
      // Declare exchange and queue
      const exchangeName = 'healthcare_events';
      await this.channel.assertExchange(exchangeName, 'topic', { durable: true });
      
      console.log('RabbitMQ Publisher connected');
    } catch (error) {
      console.error('RabbitMQ connection error:', error);
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishEvent(eventType, payload) {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not initialized');
      }

      const exchangeName = 'healthcare_events';
      const routingKey = `healthcare.${eventType.toLowerCase()}`;
      
      const message = JSON.stringify({
        type: eventType,
        timestamp: new Date().toISOString(),
        payload,
      });

      this.channel.publish(
        exchangeName,
        routingKey,
        Buffer.from(message),
        { persistent: true }
      );

      console.log(`Event published: ${eventType}`, payload);
    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}

module.exports = new RabbitMQPublisher();
