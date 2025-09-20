// Database retry utility to handle connection timeouts
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if it's a connection error
      const isConnectionError = 
        error.message?.includes("Can't reach database server") ||
        error.message?.includes("Connection error") ||
        error.message?.includes("timeout") ||
        error.code === 'P1001' || // Connection error
        error.code === 'P1008' || // Connection timeout
        error.code === 'P1017'; // Database connection closed
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`Database connection attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Specific retry wrapper for Prisma operations
export const prismaWithRetry = async (prismaOperation) => {
  return await withRetry(prismaOperation, 3, 1000);
};

export default { withRetry, prismaWithRetry };