import { useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import logo from "../../images/icon48.png";
import "./NavbarComponent.css";
import AboutComponent from "../Pages/About/AboutComponent";
import TabGroupList from "../Pages/TabGroups/TabGroupList";

const NavbarComponent = () => {
  const [activeTab, setActiveTab] = useState("groups");

  return (
    <>
      <Navbar bg="light" className="app-navbar">
        <Container>
          <Navbar.Brand onClick={() => setActiveTab("groups")} role="button">
            <img src={logo} className="app-logo" alt="" />
            vTabs
          </Navbar.Brand>
          {/* `as="button"` keeps these keyboard-focusable without a fragment
              href that would navigate the popup. */}
          <Nav className="ms-auto">
            <Nav.Link
              as="button"
              active={activeTab === "groups"}
              onClick={() => setActiveTab("groups")}
            >
              My Groups
            </Nav.Link>
            <Nav.Link
              as="button"
              active={activeTab === "about"}
              onClick={() => setActiveTab("about")}
            >
              About
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {activeTab === "groups" ? <TabGroupList /> : <AboutComponent />}
    </>
  );
};

export default NavbarComponent;
