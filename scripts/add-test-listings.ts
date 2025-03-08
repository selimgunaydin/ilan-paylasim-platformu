
import fetch from 'node-fetch';

async function addTestListings() {
  const listings = [
    {
      title: "Test İlan 1",
      description: "Bu bir test ilanıdır",
      city: "İstanbul",
      categoryId: 1,
      listingType: "premium",
      contactPerson: "Test Kişi 1",
      phone: "5551234567"
    },
    {
      title: "Test İlan 2",
      description: "İkinci test ilanı",
      city: "Ankara",
      categoryId: 2,
      listingType: "premium",
      contactPerson: "Test Kişi 2",
      phone: "5551234568"
    },
    {
      title: "Test İlan 3",
      description: "Üçüncü test ilanı",
      city: "İzmir",
      categoryId: 3,
      listingType: "premium",
      contactPerson: "Test Kişi 3",
      phone: "5551234569"
    },
    {
      title: "Test İlan 4",
      description: "Dördüncü test ilanı",
      city: "Bursa",
      categoryId: 4,
      listingType: "premium",
      contactPerson: "Test Kişi 4",
      phone: "5551234570"
    }
  ];

  for (const listing of listings) {
    try {
      const response = await fetch('http://localhost:5000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listing)
      });
      
      if (!response.ok) {
        throw new Error('İlan eklenemedi');
      }
      
      console.log(`${listing.title} başarıyla eklendi`);
    } catch (error) {
      console.error(`${listing.title} eklenirken hata oluştu:`, error);
    }
  }
}

addTestListings();
