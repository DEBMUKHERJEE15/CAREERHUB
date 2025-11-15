export const getEvents = (req, res) => {
  res.json([
    {
      title: "National Tech Summit 2024",
      location: "New Delhi",
      date: "25-27 Nov 2024",
    },
    {
      title: "Resume & Interview Workshop",
      location: "Online",
      date: "10 Dec 2024",
    },
  ]);
};
