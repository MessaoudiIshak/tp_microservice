const amqp = require('amqplib');
const ConsultationModel = require('../models/ConsultationModel');

class RabbitMQConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost');
      this.channel = await this.connection.createChannel();
      
      console.log('RabbitMQ Consumer connected');
    } catch (error) {
      console.error('RabbitMQ connection error:', error);
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }

  async startConsuming() {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not initialized');
      }

      const exchangeName = 'healthcare_events';
      const queueName = 'consultation_queue';
      const routingKey = 'healthcare.appointment_created';

      // Declare exchange and queue
      await this.channel.assertExchange(exchangeName, 'topic', { durable: true });
      const queue = await this.channel.assertQueue(queueName, { durable: true });
      
      // Bind queue to exchange
      await this.channel.bindQueue(queue.queue, exchangeName, routingKey);

      // Consume messages
      await this.channel.consume(queue.queue, async (msg) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString());
            console.log('Received event:', event);

            // Process APPOINTMENT_CREATED event
            if (event.type === 'APPOINTMENT_CREATED') {
              await this.handleAppointmentCreated(event.payload);
            }

            // Acknowledge the message
            this.channel.ack(msg);
          } catch (error) {
            console.error('Error processing message:', error);
            // Negative acknowledgment - requeue the message
            this.channel.nack(msg, false, true);
          }
        }
      });

      console.log('Consultation service listening for APPOINTMENT_CREATED events');
    } catch (error) {
      console.error('Error starting RabbitMQ consumer:', error);
      setTimeout(() => this.startConsuming(), 5000);
    }
  }

  async handleAppointmentCreated(payload) {
    try {
      const {
        rdvId,
        doctorId,
        patientId,
        speciality,
        date,
      } = payload;

      console.log(`Creating consultation for appointment ${rdvId}`);

      // Create consultation record in database
      const consultation = await ConsultationModel.createConsultation(
        doctorId,
        patientId,
        speciality,
        rdvId,
        date
      );

      console.log('Consultation created successfully:', consultation);
    } catch (error) {
      console.error('Error creating consultation:', error);
      throw error;
    }
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}

module.exports = new RabbitMQConsumer();
