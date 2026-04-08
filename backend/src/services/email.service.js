export const mockSendEmail = async ({ to, subject, message }) => {
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Message: ${message}`);
};
