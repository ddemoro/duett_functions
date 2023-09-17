export interface Match {
    matched: string[];// list of profile IDs (2)
    profiles: Person[];
    creationDate: any;
}

export interface PossibleMatch {
    profileOne:string;
    profileTwo:string;
    teamOneProfiles: Friend[];
    teamTwoProfiles: Friend[];
    creationDate: any;
}

export interface Like {
    profileID: string; // who is liking the person
    likedProfileID: string; // who they are liking
    creationDate: any;
}

export interface Person {
    avatarURL: string;
    fullName: string;
    age: number;
    living:string;
    profileID: string;
}


export interface Profile {
    id: string;
    avatarURL:string;
    username: string;
    emailAddress: string;
    fullName: string;
    description: string;
    creationDate: any;
    configured: boolean;
    fcmToken: string;
    phoneNumber: string;
    receiveMarketingMaterial: boolean;
    birthday:any;
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
    friends: Friend[];
    benchedFriends: Friend[];
    about: string;
    qualities: string;
    memorableMoments: string;
}

export interface Media {
    url: string;
    image: boolean;
}

export interface Friend {
    uid: string;
    businessName: string;
    email: string;
    contactName: string;
    phoneNumber: string;
    avatarURL: string;
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

