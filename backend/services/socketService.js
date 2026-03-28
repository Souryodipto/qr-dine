/**
 * Socket.io Service — Manages real-time events
 * Each restaurant gets its own room (by restaurantId)
 */

let io = null;

const initSocket = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // Restaurant joins its own room
    socket.on('join-restaurant', (restaurantId) => {
      socket.join(`restaurant-${restaurantId}`);
      console.log(`🏠 Socket ${socket.id} joined room restaurant-${restaurantId}`);
    });

    // Leave restaurant room
    socket.on('leave-restaurant', (restaurantId) => {
      socket.leave(`restaurant-${restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });
};

// Emit new order to restaurant's room
const emitNewOrder = (restaurantId, order) => {
  if (io) {
    io.to(`restaurant-${restaurantId}`).emit('new-order', order);
    console.log(`📡 New order emitted to restaurant-${restaurantId}`);
  }
};

// Emit order status update to restaurant's room
const emitOrderUpdate = (restaurantId, orderId, status) => {
  if (io) {
    io.to(`restaurant-${restaurantId}`).emit('order-updated', { orderId, status });
  }
};

module.exports = { initSocket, emitNewOrder, emitOrderUpdate };
