export type Person = {
  id: string;
  name: string;
  // How the canvas refers to them in feeds, e.g. "Mika T.".
  short: string;
  handle: string;
  city?: string;
};

export const people: Person[] = [
  {
    id: 'amani',
    name: 'Amani Wekesa',
    short: 'Amani W.',
    handle: 'amani',
    city: 'Nairobi',
  },
  {id: 'mika', name: 'Mika Tanaka', short: 'Mika T.', handle: 'mika'},
  {id: 'zawadi', name: 'Zawadi Otieno', short: 'Zawadi O.', handle: 'zawadi'},
  {id: 'daniel', name: 'Daniel Kimani', short: 'Daniel K.', handle: 'daniel'},
  {id: 'ren', name: 'Ren Ito', short: 'Ren I.', handle: 'ren'},
];

export const ME = 'amani';

export const getPerson = (id: string) => {
  const person = people.find(p => p.id === id);
  if (!person) {
    throw new Error(`Unknown person: ${id}`);
  }
  return person;
};

export const firstName = (id: string) => getPerson(id).name.split(' ')[0];
