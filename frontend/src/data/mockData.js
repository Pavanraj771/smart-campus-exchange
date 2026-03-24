export const resources = [
  {
    id: 1,
    title: 'Digital Oscilloscope Kit',
    category: 'Electronics',
    owner: 'Ananya S',
    department: 'EEE',
    condition: 'Excellent',
    availability: 'Available',
    location: 'Lab Block B',
    rating: 4.8,
    description: 'Portable oscilloscope with probes and calibration sheet. Great for circuit analysis labs.',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 2,
    title: 'Engineering Mechanics Textbook',
    category: 'Books',
    owner: 'Rahul M',
    department: 'Mechanical',
    condition: 'Good',
    availability: 'Borrowed',
    location: 'Hostel H3',
    rating: 4.4,
    description: 'Latest edition with solved examples. Useful for first and second semester students.',
    image:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 3,
    title: 'Canon DSLR Camera',
    category: 'Electronics',
    owner: 'Media Club',
    department: 'Cultural',
    condition: 'Very Good',
    availability: 'Available',
    location: 'Student Activity Center',
    rating: 4.9,
    description: 'Includes two batteries, memory card, and tripod for events and project documentation.',
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 4,
    title: 'Medical Entrance Notes Bundle',
    category: 'Notes',
    owner: 'Priya D',
    department: 'Biotech',
    condition: 'Good',
    availability: 'Available',
    location: 'Library Annex',
    rating: 4.6,
    description: 'Handwritten quick-revision notes for biology and chemistry with summary diagrams.',
    image:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80'
  }
];

export const borrowRequests = [
  { id: 'RQ-1092', item: 'Digital Oscilloscope Kit', requester: 'Naveen R', duration: '3 days', status: 'Pending' },
  { id: 'RQ-1091', item: 'Canon DSLR Camera', requester: 'Fine Arts Club', duration: '2 days', status: 'Approved' },
  { id: 'RQ-1089', item: 'Engineering Mechanics Textbook', requester: 'Varun K', duration: '7 days', status: 'Returned' }
];
