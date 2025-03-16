"use client";

import { useState } from "react";

// Define FAQ item type
export interface FaqItem {
  question: string;
  answer: string;
}

export const FaqAccordion = ({ faqs }: { faqs: FaqItem[] }) => {
  return (
    <div className="space-y-2">
      {faqs.map((faq, index) => (
        <FaqAccordionItem key={index} faq={faq} />
      ))}
    </div>
  );
};

const FaqAccordionItem = ({ faq }: { faq: FaqItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-lg font-semibold">{faq.question}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 p-4 pt-0' : 'max-h-0'
        }`}
      >
        <div className="pt-2 border-t">
          <p className="text-gray-600">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}; 