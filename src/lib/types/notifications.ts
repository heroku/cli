type FollowUp = {
  body: string;
  created_at: string;
}

export type Notification = {
  body: string;
  created_at: string;
  followup: FollowUp[]
  id: string;
  read: boolean;
  resource_name: string;
  target: {
    id: string;
    type: string;
  }
  title: string;
  type: string;
}

export type Notifications = Notification[]
