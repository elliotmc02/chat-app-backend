export interface User {
  id: string;
  username: string;
  rooms: Set<string>;
}
