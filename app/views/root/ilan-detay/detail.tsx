"use client";

import { useState } from "react";

interface ListingDescriptionProps {
  description: string | null;
}

export default function ListingDescription({
  description,
}: ListingDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden p-3 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        İlan Detayları
      </h2>
      <div className="prose max-w-none">
        {description ? (
          <div className="relative">
            <div
              className={`text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                isExpanded ? "" : "max-h-[300px] overflow-hidden"
              }`}
              dangerouslySetInnerHTML={{ __html: description }}
            />
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm sm:text-base font-medium flex items-center"
            >
              {isExpanded ? (
                <>
                  Daha Az Gör
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </>
              ) : (
                <>
                  Devamını Gör
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm sm:text-base">
            Bu ilan için detay bilgisi bulunmuyor.
          </p>
        )}
      </div>
    </div>
  );
}
