type FollowUp = {
  created_at: string;
  body: string;
}

export type Notification = {
  id: string;
  created_at: string;
  title: string;
  read: boolean;
  body: string;
  target: {
    type: string;
    id: string;
  }
  followup: FollowUp[]
  resource_name: string;
  type: string;
}

export type Notifications = Notification[]
