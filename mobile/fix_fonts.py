#!/usr/bin/env python3
"""
Script to remove duplicate font references from Xcode project file
"""
import re
import sys

def fix_xcode_project(project_file):
    """Remove duplicate font references from Xcode project file"""
    
    with open(project_file, 'r') as f:
        content = f.read()
    
    # Font files to remove
    font_files = [
        'AntDesign.ttf', 'Entypo.ttf', 'EvilIcons.ttf', 'Feather.ttf',
        'FontAwesome.ttf', 'FontAwesome5_Brands.ttf', 'FontAwesome5_Regular.ttf',
        'FontAwesome5_Solid.ttf', 'FontAwesome6_Brands.ttf', 'FontAwesome6_Regular.ttf',
        'FontAwesome6_Solid.ttf', 'Fontisto.ttf', 'Foundation.ttf',
        'Ionicons.ttf', 'MaterialCommunityIcons.ttf', 'MaterialIcons.ttf',
        'Octicons.ttf', 'SimpleLineIcons.ttf', 'Zocial.ttf'
    ]
    
    # Remove PBXBuildFile entries for fonts
    for font in font_files:
        # Remove lines like: 0E4DB720B6354663968A8DD5 /* FontAwesome5_Regular.ttf in Resources */ = {isa = PBXBuildFile; fileRef = 89579A84B4224EB8A09DB26D /* FontAwesome5_Regular.ttf */; };
        pattern = rf'\s*[A-F0-9]+\s*/\*\s*{re.escape(font)}\s*in\s*Resources\s*\*/\s*=\s*{{isa\s*=\s*PBXBuildFile;\s*fileRef\s*=\s*[A-F0-9]+\s*/\*\s*{re.escape(font)}\s*\*/\s*;\s*}};'
        content = re.sub(pattern, '', content)
        
        # Remove PBXFileReference entries for fonts
        pattern = rf'\s*[A-F0-9]+\s*/\*\s*{re.escape(font)}\s*\*/\s*=\s*{{isa\s*=\s*PBXFileReference;\s*explicitFileType\s*=\s*undefined;\s*fileEncoding\s*=\s*undefined;\s*includeInIndex\s*=\s*0;\s*lastKnownFileType\s*=\s*unknown;\s*name\s*=\s*{re.escape(font)};\s*path\s*=\s*"\.\./node_modules/react-native-vector-icons/Fonts/{re.escape(font)}";\s*sourceTree\s*=\s*"<group>";\s*}};'
        content = re.sub(pattern, '', content)
    
    # Remove font references from PBXResourcesBuildPhase
    # Find the Resources build phase and remove font entries
    resources_pattern = r'(/\* Begin PBXResourcesBuildPhase section \*/.*?/\* End PBXResourcesBuildPhase section \*/)'
    
    def remove_fonts_from_resources(match):
        section = match.group(1)
        for font in font_files:
            # Remove lines that reference fonts in Resources
            pattern = rf'\s*[A-F0-9]+\s*/\*\s*{re.escape(font)}\s*in\s*Resources\s*\*/\s*,'
            section = re.sub(pattern, '', section)
        return section
    
    content = re.sub(resources_pattern, remove_fonts_from_resources, content, flags=re.DOTALL)
    
    # Write the cleaned content back
    with open(project_file, 'w') as f:
        f.write(content)
    
    print("✅ Removed duplicate font references from Xcode project file")

if __name__ == "__main__":
    project_file = "ios/IffaHealth.xcodeproj/project.pbxproj"
    fix_xcode_project(project_file)
