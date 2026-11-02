export interface EmailEvent {
  readonly email: string;
}

export interface EmailLinkEvent extends EmailEvent {
  readonly url: string;
}
