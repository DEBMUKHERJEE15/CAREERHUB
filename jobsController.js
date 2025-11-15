export const getJobs = (req, res) => {
  res.json([
    {
      title: "Senior Software Engineer (React)",
      company: "Tech Solutions Pvt. Ltd.",
      location: "Bengaluru",
      type: "Full-Time",
    },
    {
      title: "Digital Marketing Specialist",
      company: "GrowFast Agency",
      location: "Mumbai",
      type: "Remote/Hybrid",
    },
  ]);
};
