export const contacts = [
  { id: "1", name: "Maria Santos", country: "Philippines", countryCode: "PH", method: "GCash", currency: "PHP" },
  { id: "2", name: "Priya Sharma", country: "India", countryCode: "IN", method: "Paytm", currency: "INR" },
  { id: "3", name: "James Mwangi", country: "Kenya", countryCode: "KE", method: "M-Pesa", currency: "KES" },
  { id: "4", name: "Ana Rodriguez", country: "Mexico", countryCode: "MX", method: "Bank Transfer", currency: "MXN" },
  { id: "5", name: "Anh Nguyen", country: "Vietnam", countryCode: "VN", method: "Bank Transfer", currency: "VND" },
];

export const countries = [
  { country: "Philippines", countryCode: "PH", code: "PH" },
  { country: "India", countryCode: "IN", code: "IN" },
  { country: "Kenya", countryCode: "KE", code: "KE" },
  { country: "Mexico", countryCode: "MX", code: "MX" },
  { country: "Vietnam", countryCode: "VN", code: "VN" },
  { country: "Indonesia", countryCode: "ID", code: "ID" },
];

export const transactions = [
  { type: "sent" as const, name: "Maria Santos", amount: "200.00", currency: "USD", date: "Today, 2:30 PM", status: "completed" as const, countryCode: "PH" },
  { type: "received" as const, name: "John Doe", amount: "150.00", currency: "USD", date: "Yesterday, 10:15 AM", status: "completed" as const, countryCode: "US" },
  { type: "sent" as const, name: "Priya Sharma", amount: "500.00", currency: "USD", date: "Jul 1, 5:45 PM", status: "pending" as const, countryCode: "IN" },
  { type: "sent" as const, name: "James Mwangi", amount: "75.00", currency: "USD", date: "Jun 30, 9:00 AM", status: "completed" as const, countryCode: "KE" },
  { type: "received" as const, name: "Ana Rodriguez", amount: "300.00", currency: "USD", date: "Jun 28, 3:22 PM", status: "completed" as const, countryCode: "MX" },
  { type: "sent" as const, name: "Anh Nguyen", amount: "125.00", currency: "USD", date: "Jun 25, 11:30 AM", status: "completed" as const, countryCode: "VN" },
];