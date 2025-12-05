// New file: services/chatService.ts
import type { ChatMessage, UserRole, AgroDealer } from '../types';

let nextId = 10;

// Mock database for chat messages
const MOCK_MESSAGES: ChatMessage[] = [
    {
        id: 'msg-001',
        caseId: 'case-001',
        senderName: 'J. Mwangi',
        senderRole: 'farmer',
        message: 'I saw these spots this morning. Is it serious?',
        timestamp: Date.now() - 2 * 3600000,
    },
    {
        id: 'msg-002',
        caseId: 'case-001',
        senderName: 'Dr. A. Okoro',
        senderRole: 'expert',
        message: 'Thanks for the photo. It looks like early-stage Gray Leaf Spot. Can you confirm if the lesions are rectangular?',
        timestamp: Date.now() - 1 * 3600000,
    },
    {
        id: 'msg-003',
        caseId: 'case-001',
        senderName: 'J. Mwangi',
        senderRole: 'farmer',
        message: 'Yes, they are. What should I do?',
        timestamp: Date.now() - 0.5 * 3600000,
    },
    {
        id: 'msg-004',
        caseId: 'case-004',
        senderName: 'FARMER-021',
        senderRole: 'farmer',
        message: 'The lower leaves on my maize are turning yellow. I haven\'t seen any insects.',
        timestamp: Date.now() - 5 * 3600000,
    },
];

export const chatService = {
  async getMessagesForCase(caseId: string): Promise<ChatMessage[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            const caseMessages = MOCK_MESSAGES
                .filter(m => m.caseId === caseId && !m.dealerId) // Exclude dealer-specific chats
                .sort((a, b) => a.timestamp - b.timestamp);
            resolve(caseMessages);
        }, 300);
    });
  },

  async getMessagesForDealerChat(caseId: string, dealerId: string): Promise<ChatMessage[]> {
     return new Promise(resolve => {
        setTimeout(() => {
            const chatMessages = MOCK_MESSAGES
                .filter(m => m.caseId === caseId && m.dealerId === dealerId)
                .sort((a, b) => a.timestamp - b.timestamp);
            resolve(chatMessages);
        }, 100);
    });
  },
  
  async initiateChatWithDealer(
    caseId: string,
    dealer: AgroDealer,
    initialMessage: string
  ): Promise<ChatMessage[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            // Check if a chat already exists
            const existingChat = MOCK_MESSAGES.some(m => m.caseId === caseId && m.dealerId === dealer.id);

            if (!existingChat) {
                const farmerMessage: ChatMessage = {
                    id: `msg-00${nextId++}`,
                    caseId,
                    dealerId: dealer.id,
                    senderName: 'J. Mwangi', // In a real app, this would be the logged in user's name
                    senderRole: 'farmer',
                    message: initialMessage,
                    timestamp: Date.now(),
                };
                MOCK_MESSAGES.push(farmerMessage);

                const agronomistWelcome: ChatMessage = {
                    id: `msg-00${nextId++}`,
                    caseId,
                    dealerId: dealer.id,
                    senderName: dealer.agronomistName || dealer.name,
                    senderRole: 'agro-dealer',
                    message: `Hello! This is ${dealer.agronomistName || 'the specialist'} at ${dealer.name}. I see you have a high-risk case. I'm reviewing the details now. How can I help?`,
                    timestamp: Date.now() + 1000,
                };
                MOCK_MESSAGES.push(agronomistWelcome);
            }
            
            this.getMessagesForDealerChat(caseId, dealer.id).then(resolve);
        }, 500);
    });
  },

  async sendMessage(
    caseId: string,
    senderName: string,
    senderRole: UserRole,
    message: string,
    dealerId?: string
  ): Promise<ChatMessage> {
    return new Promise(resolve => {
        setTimeout(() => {
            const newMessage: ChatMessage = {
                id: `msg-00${nextId++}`,
                caseId,
                dealerId,
                senderName,
                senderRole,
                message,
                timestamp: Date.now(),
            };
            MOCK_MESSAGES.push(newMessage);
            resolve(newMessage);
        }, 200);
    });
  }
};