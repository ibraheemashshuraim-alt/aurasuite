const fs = require('fs');
let content = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');

const search = `                          let finalProfileId = null;
                          const { data: existingProfile } = await supabase.from('profiles').select('*').eq('email', org.email).maybeSingle();
                          
                          if (existingProfile) {
                             finalProfileId = existingProfile.id;
                             await supabase.from('profiles').update({
                               organization_id: org.id, full_name: org.owner_name,
                               role: 'admin', category: 'A', domain: 'Admin', username, password_hash: tempPassword,
                               card_number: cardNumber, is_first_login: true, org_mode: org.working_hours?.business_type || 'software_house'
                             }).eq('id', existingProfile.id);
                          } else {
                             const { data: profileData } = await supabase.from('profiles').insert({
                               organization_id: org.id, email: org.email, full_name: org.owner_name,
                               role: 'admin', category: 'A', domain: 'Admin', username, password_hash: tempPassword,
                               card_number: cardNumber, is_first_login: true, org_mode: org.working_hours?.business_type || 'software_house'
                             }).select().single();
                             if (profileData) finalProfileId = profileData.id;
                          }

                          let updatedOrNewProfile = null;
                          if (finalProfileId) {
                            if (existingProfile) {
                              await supabase.from('digital_cards').update({
                                card_number: cardNumber, username, temp_password: tempPassword,
                                organization_id: org.id, email: org.email,
                                is_revoked: false
                              }).eq('profile_id', finalProfileId);
                              
                              updatedOrNewProfile = {
                                ...existingProfile,
                                organization_id: org.id, full_name: org.owner_name,
                                role: 'admin', category: 'A', domain: 'Admin', username,
                                card_number: cardNumber, is_first_login: true, org_mode: org.working_hours?.business_type || 'software_house'
                              };
                            } else {
                              await supabase.from('digital_cards').insert({
                                card_number: cardNumber, username, temp_password: tempPassword,
                                profile_id: finalProfileId, organization_id: org.id, email: org.email,
                                is_revoked: false
                              });
                            }
                          }`;

const replace = `                          let finalProfileId = null;
                          let updatedOrNewProfile = null;
                          const { data: existingProfile } = await supabase.from('profiles').select('*').eq('email', org.email).maybeSingle();
                          
                          if (existingProfile) {
                             finalProfileId = existingProfile.id;
                             await supabase.from('profiles').update({
                               organization_id: org.id, full_name: org.owner_name,
                               role: 'admin', category: 'A', domain: 'Admin', username, password_hash: tempPassword,
                               card_number: cardNumber, is_first_login: true, org_mode: org.working_hours?.business_type || 'software_house'
                             }).eq('id', existingProfile.id);
                             updatedOrNewProfile = {
                               ...existingProfile,
                               organization_id: org.id, full_name: org.owner_name,
                               role: 'admin', category: 'A', domain: 'Admin', username,
                               card_number: cardNumber, is_first_login: true, org_mode: org.working_hours?.business_type || 'software_house'
                             };
                          } else {
                             const { data: profileData } = await supabase.from('profiles').insert({
                               organization_id: org.id, email: org.email, full_name: org.owner_name,
                               role: 'admin', category: 'A', domain: 'Admin', username, password_hash: tempPassword,
                               card_number: cardNumber, is_first_login: true, org_mode: org.working_hours?.business_type || 'software_house'
                             }).select().single();
                             if (profileData) {
                               finalProfileId = profileData.id;
                               updatedOrNewProfile = profileData;
                             }
                          }

                          if (finalProfileId) {
                            if (existingProfile) {
                              await supabase.from('digital_cards').update({
                                card_number: cardNumber, username, temp_password: tempPassword,
                                organization_id: org.id, email: org.email,
                                is_revoked: false
                              }).eq('profile_id', finalProfileId);
                            } else {
                              await supabase.from('digital_cards').insert({
                                card_number: cardNumber, username, temp_password: tempPassword,
                                profile_id: finalProfileId, organization_id: org.id, email: org.email,
                                is_revoked: false
                              });
                            }
                          }`;

content = content.replace(search, replace);
fs.writeFileSync('frontend/app/dashboard/page.js', content);
