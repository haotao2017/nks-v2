package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

@Data
@NoArgsConstructor
@Entity
@Table(name = "Users", schema = "nbkUser")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "FullName", length = 250)
    private String fullName;

    @Column(name = "UserName", length = 50)
    private String userName;

    @Column(name = "Designation", length = 250)
    private String designation;

    @Column(name = "Email", length = 500)
    private String email;

    @Column(name = "Password", length = 255)
    private String password;

    @Column(name = "UserTypeID")
    private Integer userTypeID;

    @Lob
    @Column(name = "Address", columnDefinition = "nvarchar(max)")
    private String address;

    @Column(name = "ContactNo", length = 250)
    private String contactNo;

    @Column(name = "IsActive")
    private Boolean isActive;

    @Column(name = "Picture", length = 250)
    private String picture;

    @Lob
    @Column(name = "Token", columnDefinition = "nvarchar(max)")
    private String token;

    @Column(name = "TokenValidFrom")
    private LocalDateTime tokenValidFrom;

    @Column(name = "TokenValidTo")
    private LocalDateTime tokenValidTo;

    @Column(name = "ContactId")
    private Integer contactId;

    @Column(name = "IsAdmin")
    private Boolean isAdmin;

    @Column(name = "CompanyID")
    private Integer companyID;

    @Column(name = "IsSystemOwner")
    private Boolean isSystemOwner;

    // ---- UserDetails ----

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String role = Boolean.TRUE.equals(isAdmin) ? "ROLE_ADMIN" : "ROLE_USER";
        return Collections.singletonList(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getUsername() {
        return userName;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return Boolean.TRUE.equals(isActive);
    }
}
