A nodejs script to transform AWS & Google IP ranges in PFSense format.

This script use [https://ip-ranges.amazonaws.com/ip-ranges.json](https://ip-ranges.amazonaws.com/ip-ranges.json) to grab AWS ip ranges (as stated by the official [AWS documention](https://docs.aws.amazon.com/fr_fr/general/latest/gr/aws-ip-ranges.html))

This script use [https://support.google.com/a/answer/60764?hl=fr](https://support.google.com/a/answer/60764?hl=fr) to grab Google ip ranges.

See [https://doc.pfsense.org/index.php/Aliases#URL_Table_Aliases](https://doc.pfsense.org/index.php/Aliases#URL_Table_Aliases) for PFSense Help.

# Usage
node generate.js

# Build
npm install
