export const getCourses = (req, res) => {
  res.json([
    {
      name: "Professional Data Science Certification",
      duration: "120 Hours",
      rating: 4.8,
    },
    {
      name: "Full-Stack Web Development Bootcamp",
      duration: "6 Months",
      rating: 4.6,
    },
  ]);
};
