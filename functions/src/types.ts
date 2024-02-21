export interface Match {
    id?: string;
    matched: string[];// list of profile IDs (2)
    profiles: Person[];
    completed: boolean;
    pairIds: string[],
    approvedPairs: string[],
    rejectedPairs: string[],
    creationDate: any;
}

export interface PossibleMatch {
    id?:string;
    matchID: string; // The id of the match this was created by
    friend: Person; // the friend who created this match
    match: Person; // the person they matched with
    choices: Choice[];
    uid: string; // Who this should go to
    completed: boolean; // When the user completes their matching
    creationDate: any;
}

export interface Like {
    profileID: string; // who is liking the person
    likedProfileID: string; // who they are liking
    creationDate: any;
}

export interface Person {
    avatarURL: string;
    firstName: string;
    age: number;
    living: string;
    profileID: string;
}


export interface Profile {
    id: string;
    avatarURL: string;
    username: string;
    emailAddress: string;
    firstName: string;
    description: string;
    creationDate: any;
    configured: boolean;
    friends:boolean;
    fcmToken: string;
    phoneNumber: string;
    receiveMarketingMaterial: boolean;
    birthday: any;
    living: GeoLocation;
    gender: string;
    datingType: string;
    height: number;
    ethnicity: string;
    children: string;
    hometown: InfoItem;
    work: InfoItem;
    jobTitle: InfoItem;
    school: InfoItem;
    education: InfoItem;
    religion: InfoItem;
    politics: InfoItem;
    drinks: InfoItem;
    smoke: InfoItem;
    weed: InfoItem;
    drugs: InfoItem;
    media: Media[];
    about: string;
    qualities: string;
    memorableMoments: string;
    inviteCode: string;
    likedBy:string[]
}

export interface Media {
    url: string;
    image: boolean;
}


export interface Friend {
    id?: string;
    uid: string;
    friendUID: string;
    fullName: string;
    phone: string;
    inviteCode?: string;
    accepted: boolean;
    avatarURL:string;
    isStarter: boolean;
    creationDate: any;
    type?:string;
}

export interface Choice {
    uid: string;
    firstName: string;
    avatarURL: string;
    liked: boolean;
    rejected: boolean;
}


export interface Address {
    line1: string;
    line2: string;
    country: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface InfoItem {
    data: string;
    visible: boolean;
}

export interface GeoLocation {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
}

export interface Pair {
    id?:string;
    matchID: string;
    players: Player[];
    playerIds: string[];
    matchMakerIds: string[];
    approved: string[];
    rejected: string[];
    creationDate: any;
}

export interface Player {
    firstName: string;
    avatarURL: string;
    uid: string;
    matchMakerName: string;
    matchMakerID: string;
    matchMakerAvatarURL: string;
}

export interface DuettChat {
    id?: string;
    matchID?: string;
    members: string[];
    pairs: Pair[];
    matchMakers: string[];
    creationDate?: any;
}

export interface ChatMessage {
    id?: string;
    text: string;
    duettID: string;
    fromID: string;
    creationDate: any;
    imageURL: string;
    read: boolean;
    avatarURL: string;
    firstName: string;
}

export interface Notification {
    id?: string;
    text: string;
    duettID?: string;
    matchID?:string;
    possibleMatchID?:string;
    likedByUID?:string;
    read:boolean;
    images: string[];
    creationDate: any;
    uid: string;
}
